import React, { useState, useEffect } from 'react';
import { ProblemCard, CategoryFilter, StatsPanel } from './ProblemCard.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Dashboard({ problems, stats, loading }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => {
    setFilteredProblems(selectedCategory === 'all' ? problems : problems.filter((p) => p.category === selectedCategory));
  }, [problems, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      if (res.ok) setCategories(await res.json());
    } catch (err) { console.error('Failed to fetch categories:', err); }
  };

  if (loading) return <div className="loading">Loading problems...</div>;

  return (
    <>
      <div className="dashboard">
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <StatsPanel stats={stats} />
            <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
          </aside>
          <main className="dashboard-main">
            <div className="problems-section">
              <div className="section-header">
                <h2>Trending Problems{selectedCategory !== 'all' && ` • ${selectedCategory}`}</h2>
                <span className="count">{filteredProblems.length} found</span>
              </div>
              {filteredProblems.length === 0 ? (
                <div className="empty-state"><p>No problems found</p></div>
              ) : (
                <div className="problems-grid">
                  {filteredProblems.map((problem) => (
                    <ProblemCard key={problem.id} problem={problem} onClick={() => setSelectedProblem(problem)} />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      {selectedProblem && <Modal problem={selectedProblem} onClose={() => setSelectedProblem(null)} />}
    </>
  );
}

function Modal({ problem, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/problems/${problem.id}`).then(r => r.json()).then(setDetails).finally(() => setLoading(false)).catch(console.error);
  }, [problem.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        {loading ? <div>Loading...</div> : (
          <>
            <h2>{problem.problem_text}</h2>
            <div className="problem-meta">
              <span className="badge category">{problem.category}</span>
              <span className="badge frequency">Mentioned {problem.frequency}x</span>
              <span className="badge score">Score: {Math.round(problem.trend_score)}</span>
            </div>
            {details?.sources?.length > 0 && (
              <div className="sources-section">
                <h3>Where people mention this:</h3>
                <div className="sources-list">
                  {details.sources.slice(0, 5).map((source) => (
                    <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="source-item">
                      <div className="source-title">{source.title}</div>
                      <div className="source-meta">r/{source.subreddit} • {source.score} upvotes</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
