import React, { useEffect, useState } from 'react';
import { loadLocalLeaderboard } from '../utils/localStorage';
import { useLeaderboardAPI } from '../services/hooks';

// PUBLIC_INTERFACE
export default function Leaderboard() {
  /** Displays local leaderboard and provides placeholder for global leaderboard via API. */
  const [local, setLocal] = useState([]);
  const { listGlobalScores, globalScores, isLoading, error } = useLeaderboardAPI();

  useEffect(() => {
    setLocal(loadLocalLeaderboard());
    listGlobalScores(); // safe, backend may not be available
  }, [listGlobalScores]);

  return (
    <div className="panel">
      <h2>Leaderboard</h2>
      <section>
        <h3>Local</h3>
        <ol>
          {local.map((s, i) => (
            <li key={`${s.name}-${i}`}>
              <strong>{s.name}</strong> — Score: {s.score} — Time: {s.time.toFixed(1)}s — Date: {new Date(s.date).toLocaleString()}
            </li>
          ))}
          {local.length === 0 && <p>No local scores yet. Play a challenge to add some!</p>}
        </ol>
      </section>
      <section>
        <h3>Global (API)</h3>
        {isLoading && <p>Loading...</p>}
        {error && <p style={{ color: 'var(--warning)' }}>Global scores unavailable: {error}</p>}
        {!isLoading && !error && (
          <ol>
            {globalScores.map((s, i) => (
              <li key={`${s.id || i}`}>
                <strong>{s.name}</strong> — Score: {s.score} — Time: {s.time.toFixed(1)}s
              </li>
            ))}
            {globalScores.length === 0 && <p>No scores available.</p>}
          </ol>
        )}
      </section>
    </div>
  );
}
