import fetch from 'node-fetch';

/**
 * Reddit scraper using PRAW-like approach with fetch
 * Gets posts from target subreddits using Reddit's JSON API
 */

export class RedditScraper {
  constructor(userAgent = 'ProblemRadar/0.1') {
    this.userAgent = userAgent;
    this.baseUrl = 'https://www.reddit.com';
  }

  /**
   * Fetch posts from a subreddit
   * @param {string} subreddit - Subreddit name (without r/)
   * @param {string} sort - Sort by: hot, new, top, rising
   * @param {number} limit - Number of posts to fetch
   */
  async fetchPosts(subreddit, sort = 'new', limit = 50) {
    try {
      const url = `${this.baseUrl}/r/${subreddit}/${sort}.json?limit=${limit}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`);
      }

      const data = await response.json();
      const posts = [];

      // Extract posts from Reddit JSON structure
      if (data.data && data.data.children) {
        data.data.children.forEach((item) => {
          if (item.kind === 't3' && item.data) {
            const post = item.data;
            posts.push({
              reddit_id: post.id,
              subreddit: post.subreddit,
              title: post.title,
              content: post.selftext,
              author: post.author,
              url: `https://reddit.com${post.permalink}`,
              score: post.score,
              created_at: new Date(post.created_utc * 1000),
            });
          }
        });
      }

      console.log(`✓ Fetched ${posts.length} posts from r/${subreddit}`);
      return posts;
    } catch (error) {
      console.error(`✗ Error fetching r/${subreddit}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch posts from multiple subreddits
   */
  async fetchMultiple(subreddits, sort = 'new', limit = 50) {
    const allPosts = [];

    for (const sub of subreddits) {
      const posts = await this.fetchPosts(sub, sort, limit);
      allPosts.push(...posts);
      // Rate limiting - Reddit requests generous delays
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return allPosts;
  }

  /**
   * Search subreddit for posts matching keywords
   */
  async search(subreddit, query, limit = 50) {
    try {
      const url = `${this.baseUrl}/r/${subreddit}/search.json?q=${encodeURIComponent(
        query
      )}&restrict_sr=on&limit=${limit}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (!response.ok) {
        throw new Error(`Search error: ${response.status}`);
      }

      const data = await response.json();
      const posts = [];

      if (data.data && data.data.children) {
        data.data.children.forEach((item) => {
          if (item.kind === 't3' && item.data) {
            const post = item.data;
            posts.push({
              reddit_id: post.id,
              subreddit: post.subreddit,
              title: post.title,
              content: post.selftext,
              author: post.author,
              url: `https://reddit.com${post.permalink}`,
              score: post.score,
              created_at: new Date(post.created_utc * 1000),
            });
          }
        });
      }

      console.log(`✓ Found ${posts.length} posts matching "${query}" in r/${subreddit}`);
      return posts;
    } catch (error) {
      console.error(`✗ Search error in r/${subreddit}:`, error.message);
      return [];
    }
  }
}

export default RedditScraper;
