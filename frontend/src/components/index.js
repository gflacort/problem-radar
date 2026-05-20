import React from 'react';
import '../styles/Components.css';

/**
 * ProblemCard - Display a single problem with score and metadata
 */
export function ProblemCard({ problem, onClick }) {
  const sentimentEmoji = problem.avg_sentiment < -0.3 ? '😤' : problem.avg_sentiment > 0.3 ? '🤩' : '😐';

  return (
    <div className="problem-card" onClick={onClick}>
      <div className="card-header">
        <span className="sentiment">{sentimentEmoji}</span>
        <span className="category-badge">{problem.category}</span>
      </div>

      <h3 className="problem-title">{problem.problem_text}</h3>

      <div className="card-stats">
        <div className="stat">
          <span className="stat-label">Mentioned</span>
          <span className="stat-value">{problem.frequency}x</span>
        </div>
        <div className="stat">
          <span className="stat-label">Trend Score</span>
          <span className="stat-value">{Math.round(problem.trend_score)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Source</span>
          <span className="stat-value">r/{problem.source_subreddit}</span>
        </div>
      </div>

      <div className="card-footer">
        <button className="view-btn">View Details →</button>
      </div>
    </div>
  );
}

/**
 * CategoryFilter - Filter problems by category
 */
export function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <div className="category-filter">
      <h3>Categories</h3>
      <div className="filter-list">
        <button
          className={`filter-item ${selected === 'all' ? 'active' : ''}`}
          onClick={() => onSelect('all')}
        >
          All Problems
        </button>

        {categories.map((cat) => (
          <button
            key={cat.category}
            className={`filter-item ${selected === cat.category ? 'active' : ''}`}
            onClick={() => onSelect(cat.category)}
          >
            <span className="filter-name">{cat.category}</span>
            <span className="filter-count">{cat.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * StatsPanel - Overview statistics
 */
export function StatsPanel({ stats }) {
  if (!stats) return null;

  return (
    <div className="stats-panel">
      <h3>Overview</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-number">{stats.total_problems || 0}</div>
          <div className="stat-name">Total Problems</div>
        </div>

        <div className="stat-item">
          <div className="stat-number">{stats.num_categories || 0}</div>
          <div className="stat-name">Categories</div>
        </div>

        <div className="stat-item">
          <div className="stat-number">
            {stats.avg_frequency ? stats.avg_frequency.toFixed(1) : 0}
          </div>
          <div className="stat-name">Avg Mentions</div>
        </div>

        <div className="stat-item">
          <div className="stat-number">
            {stats.avg_trend_score ? Math.round(stats.avg_trend_score) : 0}
          </div>
          <div className="stat-name">Avg Score</div>
        </div>
      </div>
    </div>
  );
}

export default {
  ProblemCard,
  CategoryFilter,
  StatsPanel,
};
