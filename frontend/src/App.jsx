import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [problemsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/problems?limit=50`),
        fetch(`${API_URL}/stats`),
      ]);

      if (!problemsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const problemsData = await problemsRes.json();
      const statsData = await statsRes.json();

      setProblems(problemsData);
      setStats(statsData);
      setLastSync(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/sync`, { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      // Fetch updated data after a delay
      setTimeout(fetchData, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🎯 Problem Radar</h1>
          <p>Discover what creators want to build</p>
        </div>
        <div className="header-actions">
          <button className="sync-btn" onClick={handleSync} disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
          {lastSync && <span className="last-sync">Last sync: {lastSync}</span>}
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main className="app-main">
        <Dashboard problems={problems} stats={stats} loading={loading} />
      </main>

      <footer className="app-footer">
        <p>Real problems from real people • Powered by Reddit + Claude</p>
      </footer>
    </div>
  );
}

export default App;
