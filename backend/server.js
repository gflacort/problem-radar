import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { initDatabase, getDatabase } from './db/init.js';
import RedditScraper from './scrapers/reddit.js';
import ProblemExtractor from './services/problemExtractor.js';
import TrendAnalyzer from './services/trendAnalyzer.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Services
const scraper = new RedditScraper();
const extractor = new ProblemExtractor();
const analyzer = new TrendAnalyzer();

let db = null;

/**
 * Initialize and start the server
 */
async function start() {
  try {
    db = await initDatabase();
    console.log('✓ Database initialized');

    // Routes
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    /**
     * GET /api/problems - Get trending problems
     * Query params: category, limit, sortBy
     */
    app.get('/api/problems', (req, res) => {
      const { category, limit = 20, sortBy = 'trend_score' } = req.query;
      let query = 'SELECT * FROM problems WHERE is_active = 1';
      const params = [];

      if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
      }

      query += ` ORDER BY ${sortBy} DESC LIMIT ?`;
      params.push(parseInt(limit));

      db.all(query, params, (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      });
    });

    /**
     * GET /api/problems/:id - Get problem details with sources
     */
    app.get('/api/problems/:id', (req, res) => {
      const { id } = req.params;

      db.get('SELECT * FROM problems WHERE id = ?', [id], (err, problem) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (!problem) {
          return res.status(404).json({ error: 'Problem not found' });
        }

        // Get source posts
        db.all(
          `SELECT rp.* FROM reddit_posts rp
           JOIN problem_mentions pm ON rp.id = pm.post_id
           WHERE pm.problem_id = ?
           ORDER BY rp.created_at DESC`,
          [id],
          (err, posts) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json({ ...problem, sources: posts });
          }
        );
      });
    });

    /**
     * GET /api/categories - Get problem breakdown by category
     */
    app.get('/api/categories', (req, res) => {
      const query = `
        SELECT category, COUNT(*) as count, AVG(trend_score) as avg_score
        FROM problems
        WHERE is_active = 1
        GROUP BY category
        ORDER BY count DESC
      `;

      db.all(query, [], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      });
    });

    /**
     * GET /api/trending - Get top trending problems
     */
    app.get('/api/trending', (req, res) => {
      const { timeWindow = 7 } = req.query;
      const query = `
        SELECT * FROM problems
        WHERE is_active = 1
        AND julianday('now') - julianday(last_seen) <= ?
        ORDER BY trend_score DESC
        LIMIT 10
      `;

      db.all(query, [timeWindow], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      });
    });

    /**
     * POST /api/sync - Manual sync trigger (fetch and process Reddit posts)
     */
    app.post('/api/sync', async (req, res) => {
      try {
        res.json({ status: 'sync started', message: 'Processing in background...' });

        // Run async, don't wait
        syncProblems().catch((err) => console.error('Sync error:', err));
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    /**
     * GET /api/stats - Get overview stats
     */
    app.get('/api/stats', (req, res) => {
      db.get(
        `SELECT
          COUNT(*) as total_problems,
          AVG(trend_score) as avg_trend_score,
          AVG(frequency) as avg_frequency,
          COUNT(DISTINCT category) as num_categories
        FROM problems WHERE is_active = 1`,
        [],
        (err, stats) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(stats);
        }
      );
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Problem Radar running on http://localhost:${PORT}`);
      console.log(`📊 Dashboard: http://localhost:3000`);
      console.log(`📡 API: http://localhost:${PORT}/api\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

/**
 * Sync problems from Reddit
 */
async function syncProblems() {
  console.log('\n🔄 Starting sync...');

  try {
    const subreddits = (process.env.TARGET_SUBREDDITS || 'webdev,startups').split(',');

    // Fetch posts
    console.log(`📥 Fetching from ${subreddits.join(', ')}`);
    const posts = await scraper.fetchMultiple(subreddits, 'new', 30);

    if (posts.length === 0) {
      console.log('⚠️  No posts fetched');
      return;
    }

    // Store raw posts
    for (const post of posts) {
      db.run(
        `INSERT OR IGNORE INTO reddit_posts
        (reddit_id, subreddit, title, content, author, url, score, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          post.reddit_id,
          post.subreddit,
          post.title,
          post.content,
          post.author,
          post.url,
          post.score,
          post.created_at,
        ]
      );
    }

    console.log(`✓ Stored ${posts.length} posts`);

    // Extract problems
    console.log('🧠 Extracting problems with Claude...');
    const results = await extractor.extractBatch(posts, 2);

    let totalProblems = 0;
    for (const { post, problems } of results) {
      for (const prob of problems) {
        totalProblems++;

        // Upsert problem
        db.run(
          `INSERT INTO problems (problem_text, category, sentiment, frequency, source_subreddit, trend_score)
          VALUES (?, ?, ?, 1, ?, ?)
          ON CONFLICT(problem_text, source_subreddit) DO UPDATE SET
            frequency = frequency + 1,
            last_seen = CURRENT_TIMESTAMP`,
          [
            prob.problem,
            prob.category,
            prob.sentiment || 0,
            post.subreddit,
            Math.random() * 50, // Placeholder scoring
          ]
        );
      }
    }

    console.log(`✓ Extracted ${totalProblems} problems`);
    console.log('✓ Sync complete\n');
  } catch (err) {
    console.error('✗ Sync failed:', err);
  }
}

// Start
start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (db) db.close();
  process.exit(0);
});
