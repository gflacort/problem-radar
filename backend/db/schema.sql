-- Problems extracted from Reddit
CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_text TEXT NOT NULL,
  category TEXT,
  sentiment REAL DEFAULT 0.5,
  frequency INTEGER DEFAULT 1,
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  trend_score REAL DEFAULT 0,
  source_subreddit TEXT,
  is_active BOOLEAN DEFAULT 1,
  UNIQUE(problem_text, source_subreddit)
);

-- Individual posts/comments (raw data)
CREATE TABLE IF NOT EXISTS reddit_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reddit_id TEXT UNIQUE,
  subreddit TEXT,
  title TEXT,
  content TEXT,
  author TEXT,
  url TEXT,
  score INTEGER,
  created_at DATETIME,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT 0
);

-- Problem-to-post mapping
CREATE TABLE IF NOT EXISTS problem_mentions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER,
  post_id INTEGER,
  mentioned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id),
  FOREIGN KEY (post_id) REFERENCES reddit_posts(id)
);

-- Trending data (hourly snapshots for charts)
CREATE TABLE IF NOT EXISTS problem_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER,
  frequency INTEGER,
  trend_score REAL,
  snapshot_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);
CREATE INDEX IF NOT EXISTS idx_problems_trend_score ON problems(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_subreddit ON reddit_posts(subreddit);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_processed ON reddit_posts(processed);
CREATE INDEX IF NOT EXISTS idx_problem_mentions_problem ON problem_mentions(problem_id);
