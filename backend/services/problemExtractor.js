import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * Extract problems from Reddit posts using Claude
 * Identifies unmet needs, pain points, and desired features
 */
export class ProblemExtractor {
  async extractProblems(post) {
    const prompt = `Analyze this Reddit post and extract any unmet problems, pain points, or desired features mentioned.

Post Title: ${post.title}
Post Content: ${post.content}

For each distinct problem/need mentioned:
1. Extract the core problem statement (what the user is struggling with or wants)
2. Categorize it (e.g., "productivity", "AI tools", "automation", "learning", "creator tools", "development")
3. Estimate sentiment: -1 (very frustrated), 0 (neutral problem statement), 1 (excited about solution)

Return as JSON array with this structure:
[
  {
    "problem": "clear, concise problem statement",
    "category": "category name",
    "sentiment": -1 to 1,
    "is_feature_request": true/false
  }
]

Only include real, specific problems. Ignore generic complaints or off-topic comments.
If no clear problems found, return empty array [].

JSON ONLY - no other text.`;

    try {
      const message = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].text;

      // Parse JSON response
      let problems = [];
      try {
        problems = JSON.parse(responseText);
        if (!Array.isArray(problems)) {
          problems = [];
        }
      } catch (parseError) {
        console.warn('Failed to parse Claude response as JSON');
        problems = [];
      }

      return problems;
    } catch (error) {
      console.error('Claude API error:', error.message);
      return [];
    }
  }

  /**
   * Batch extract problems from multiple posts
   * @param {Array} posts - Array of Reddit posts
   * @param {number} maxConcurrent - Limit concurrent API calls
   */
  async extractBatch(posts, maxConcurrent = 3) {
    const results = [];
    const queue = [...posts];
    const inProgress = new Set();

    while (queue.length > 0 || inProgress.size > 0) {
      // Fill up to max concurrent
      while (inProgress.size < maxConcurrent && queue.length > 0) {
        const post = queue.shift();
        const promise = this.extractProblems(post).then((problems) => {
          inProgress.delete(promise);
          return { post, problems };
        });
        inProgress.add(promise);
      }

      if (inProgress.size > 0) {
        const result = await Promise.race(inProgress);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Classify problem into high-level categories
   */
  categorizeProblem(problem) {
    const text = problem.toLowerCase();

    const categories = {
      'AI Tools': ['ai', 'llm', 'chatgpt', 'claude', 'ml', 'machine learning', 'automation'],
      'Productivity': ['productivity', 'workflow', 'efficiency', 'time management', 'todo', 'notes'],
      'Development': ['code', 'dev', 'api', 'framework', 'library', 'testing', 'deployment'],
      'Writing': ['writing', 'content', 'blog', 'novel', 'editing', 'grammar'],
      'Design': ['design', 'ui', 'ux', 'graphic', 'visual', 'branding'],
      'Business': ['business', 'sales', 'marketing', 'crm', 'analytics', 'pricing'],
      'Learning': ['learn', 'course', 'education', 'tutorial', 'documentation'],
      'Creator Tools': ['creator', 'youtuber', 'streamer', 'podcast', 'video', 'editing'],
    };

    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some((kw) => text.includes(kw))) {
        return cat;
      }
    }

    return 'General';
  }
}

export default ProblemExtractor;
