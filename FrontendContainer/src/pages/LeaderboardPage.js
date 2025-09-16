import React from 'react';
import { useGameStore } from '../state/gameStore';

// PUBLIC_INTERFACE
export default function LeaderboardPage() {
  const { leaderboard, resetLeaderboard } = useGameStore();

  return (
    <section className="panel" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h3>Leaderboard (Local)</h3>
      <p>Scores are stored locally in your browser. Backend submission will appear here if configured.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th style={{ borderBottom: '1px solid var(--border-color)', padding: 8 }}>#</th>
            <th style={{ borderBottom: '1px solid var(--border-color)', padding: 8 }}>Name</th>
            <th style={{ borderBottom: '1px solid var(--border-color)', padding: 8 }}>Score</th>
            <th style={{ borderBottom: '1px solid var(--border-color)', padding: 8 }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.length === 0 && (
            <tr><td colSpan="4" style={{ padding: 12, opacity: 0.7 }}>No scores yet.</td></tr>
          )}
          {leaderboard.map((e, i) => (
            <tr key={i}>
              <td style={{ borderBottom: '1px solid var(--border-color)', padding: 8 }}>{i+1}</td>
              <td style={{ borderBottom: '1px solid var(--border-color)', padding: 8 }}>{e.name}</td>
              <td style={{ borderBottom: '1px solid var(--border-color)', padding: 8 }}>{e.score}</td>
              <td style={{ borderBottom: '1px solid var(--border-color)', padding: 8 }}>{new Date(e.date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <button className="btn danger" onClick={resetLeaderboard}>Reset Leaderboard</button>
      </div>
    </section>
  );
}
