/**
 * Daily sync job - Run via cron or manual trigger
 * Fetches latest Reddit posts and extracts problems
 *
 * Usage:
 *   node jobs/dailySync.js
 *
 * Cron setup:
 *   0 8 * * * cd /path/to/problem-radar/backend && node jobs/dailySync.js
 */

import 'dotenv/config';
import { getDatabase, initDatabase } from '../db/init.js';
import RedditScraper from '../scrapers/reddit.js';
import ProblemExtractor from '../services/problemExtractor.js';
import TrendAnalyzer from '../services/trendAnalyzer.js';

const scraper = new RedditScraper();
const extractor = new ProblemExtractor();
const analyzer = new TrendAnalyzer();

let db = null;

async function syncProblems() {
  console.log('\n🔄 Starting Problem Radar sync...');
  console.log(`⏰ ${new Date().toLocaleString()}\n`);

  try {
    // Initialize database
    db = await initDatabase();

    const subreddits = (process.env.TARGET_SUBREDDITS || 'webdev,startups').split(',');
    let totalFetched = 0;
    let totalExtracted = 0;

    // Fetch posts from each subreddit
    console.log(`📥 Fetching from: ${subreddits.join(', ')}`);
    const posts = await scraper.fetchMultiple(subreddits, 'new', 50);
    totalFetched = posts.length;

    if (posts.length === 0) {
      console.log('⚠️  No posts fetched. Exiting.');
      process.exit(0);
    }

    console.log(`✓ Fetched ${posts.length} posts total\n`);

    // Store raw posts in database
    console.log('💾 Storing posts in database...');
    for (const post of posts) {
      await new Promise((resolve, reject) => {
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
          ],
          function (err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    console.log(`✓ Posts stored\n`);

    // Extract problems using Claude
    console.log('🧠 Extracting problems with Claude (this may take a minute)...');
    const results = await extractor.extractBatch(posts, 2);

    // Store extracted problems
    console.log('💾 Storing extracted problems...');
    for (const { post, problems } of results) {
      for (const prob of problems) {
        await new Promise((resolve, reject) => {
          // Calculate initial trend score
          const trendScore = analyzer.calculateTrendScore({
            frequency: 1,
            growth_rate: 0,
            avg_sentiment: prob.sentiment || 0,
            days_active: 0,
          });

          db.run(
            `INSERT INTO problems
            (problem_text, category, sentiment, frequency, source_subreddit, trend_score)
            VALUES (?, ?, ?, 1, ?, ?)
            ON CONFLICT(problem_text, source_subreddit) DO UPDATE SET
              frequency = frequency + 1,
              last_seen = CURRENT_TIMESTAMP,
              sentiment = (sentiment + ?) / 2,
              trend_score = ?`,
            [
              prob.problem,
              prob.category || 'General',
              prob.sentiment || 0,
              post.subreddit,
              trendScore,
              prob.sentiment || 0,
              trendScore,
            ],
            function (err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        totalExtracted++;
      }
    }

    // Get stats
    const stats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as total FROM problems WHERE is_active = 1`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    console.log(`✓ Extracted ${totalExtracted} problems\n`);

    // Summary
    console.log('📊 Sync Summary:');
    console.log(`  • Posts fetched: ${totalFetched}`);
    console.log(`  • Problems extracted: ${totalExtracted}`);
    console.log(`  • Total problems in DB: ${stats.total}`);
    console.log('\n✅ Sync complete!\n');

    db.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Sync failed:', err.message);
    if (db) db.close();
    process.exit(1);
  }
}

// Run
syncProblems();
