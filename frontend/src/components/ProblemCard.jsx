import React from 'react';

export function ProblemCard({ problem, onClick }) {
  return (<div className="problem-card" onClick={onClick}><div className="card-header"><span className="category-badge">{problem.category}</span></div><h3>{problem.problem_text}</h3><div className="card-stats"><div><span>{problem.frequency}x</span></div><div><span>{Math.round(problem.trend_score)}</span></div></div></div>);
}

export function CategoryFilter({ categories, selected, onSelect }) {
  return (<div className="category-filter"><h3>Categories</h3><div className="filter-list"><button className={selected === 'all' ? 'active' : ''} onClick={() => onSelect('all')}>All</button>{categories.map(cat => <button key={cat.category} className={selected === cat.category ? 'active' : ''} onClick={() => onSelect(cat.category)}>{cat.category}</button>)}</div></div>);
}

export function StatsPanel({ stats }) {
  if (!stats) return null;
  return (<div className="stats-panel"><h3>Overview</h3><div className="stat-number">{stats.total_problems || 0}</div></div>);
}
