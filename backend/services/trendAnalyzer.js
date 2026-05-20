/**
 * Score and analyze trending problems
 * Calculates trend scores based on frequency, growth, and sentiment
 */
export class TrendAnalyzer {
  /**
   * Calculate trend score for a problem
   * Score = (frequency weight) + (growth weight) + (sentiment weight)
   *
   * @param {Object} problem - Problem data from database
   * @returns {number} Score 0-100
   */
  calculateTrendScore(problem) {
    const {
      frequency = 1,
      growth_rate = 0,
      avg_sentiment = 0.5,
      days_active = 1,
    } = problem;

    // Weight components
    const frequencyScore = Math.min(frequency / 10, 1) * 40; // 0-40 points
    const growthScore = Math.min(Math.max(growth_rate * 10, 0), 1) * 30; // 0-30 points
    const sentimentScore = (avg_sentiment + 1) * 15; // 0-30 points (sentiment -1 to 1)
    const recencyScore = Math.min(days_active / 7, 1) * 10; // 0-10 points (recent = higher)

    return frequencyScore + growthScore + sentimentScore + recencyScore;
  }

  /**
   * Aggregate problems by category
   */
  aggregateByCategory(problems) {
    const categories = {};

    problems.forEach((problem) => {
      const cat = problem.category || 'General';
      if (!categories[cat]) {
        categories[cat] = {
          name: cat,
          count: 0,
          avgScore: 0,
          problems: [],
        };
      }
      categories[cat].count++;
      categories[cat].problems.push(problem);
    });

    // Calculate averages
    Object.keys(categories).forEach((cat) => {
      const problems = categories[cat].problems;
      categories[cat].avgScore =
        problems.reduce((sum, p) => sum + p.trend_score, 0) / problems.length;
    });

    return categories;
  }

  /**
   * Detect emerging trends (growing problems)
   */
  detectEmergingTrends(problems, timeWindowDays = 7) {
    const now = Date.now();
    const windowMs = timeWindowDays * 24 * 60 * 60 * 1000;

    return problems
      .filter((p) => {
        const lastSeen = new Date(p.last_seen).getTime();
        const daysActive = (now - lastSeen) / (24 * 60 * 60 * 1000);
        return daysActive <= timeWindowDays && p.frequency >= 3; // Active + mentioned 3+ times
      })
      .sort((a, b) => b.trend_score - a.trend_score)
      .slice(0, 10);
  }

  /**
   * Find solution gap: problems with high demand but no existing solutions
   */
  findSolutionGaps(problems, existingSolutions = []) {
    const solutionTexts = existingSolutions.map((s) => s.toLowerCase());

    return problems.filter((problem) => {
      // If frequency > 5 and sentiment is frustrated (-0.5 to -1)
      const isHighDemand = problem.frequency >= 5;
      const isFrustrated = problem.avg_sentiment < -0.3;
      const noExistingSolution = !solutionTexts.some((sol) =>
        sol.includes(problem.problem_text.substring(0, 20).toLowerCase())
      );

      return isHighDemand && isFrustrated && noExistingSolution;
    });
  }

  /**
   * Rank problems for creators (best opportunities)
   */
  rankForCreators(problems) {
    return problems
      .map((p) => ({
        ...p,
        creatorScore:
          p.trend_score * 0.6 + // Trending
          (p.frequency > 10 ? 20 : 0) + // High demand
          (p.avg_sentiment < -0.5 ? 15 : 0) + // Strong pain point
          (p.avg_sentiment > 0.5 ? 10 : 0), // People excited about solutions
      }))
      .sort((a, b) => b.creatorScore - a.creatorScore);
  }

  /**
   * Calculate growth rate based on problem snapshots
   */
  calculateGrowthRate(snapshots) {
    if (snapshots.length < 2) return 0;

    // Sort by timestamp
    const sorted = snapshots.sort(
      (a, b) => new Date(a.snapshot_time) - new Date(b.snapshot_time)
    );

    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];

    if (oldest.frequency === 0) return 0;

    const timeDiff = (new Date(newest.snapshot_time) - new Date(oldest.snapshot_time)) / 1000;
    const frequencyDiff = newest.frequency - oldest.frequency;

    // Growth rate per day
    return (frequencyDiff / oldest.frequency) / (timeDiff / (24 * 60 * 60));
  }

  /**
   * Generate insights from problem data
   */
  generateInsights(problems, topN = 5) {
    const topProblems = problems.sort((a, b) => b.trend_score - a.trend_score).slice(0, topN);

    const categories = this.aggregateByCategory(problems);
    const topCategory = Object.values(categories).sort((a, b) => b.avgScore - a.avgScore)[0];

    return {
      totalProblems: problems.length,
      topProblems,
      topCategory,
      averageFrustration: problems.reduce((sum, p) => sum + p.avg_sentiment, 0) / problems.length,
      mostMentionedCategory: topCategory.name,
    };
  }
}

export default TrendAnalyzer;
