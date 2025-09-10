import React, { useEffect, useState } from 'react';
import { loadLeaderboard } from '../lib/storage.js';

/**
 * PUBLIC_INTERFACE
 * LeaderboardPanel - shows local top times per challenge.
 */
export default function LeaderboardPanel({ selectedChallenge }) {
  const [board, setBoard] = useState(loadLeaderboard());

  useEffect(() => {
    const onUpdate = (e) => {
      if (e?.detail?.type === 'leaderboard-update') {
        setBoard(loadLeaderboard());
      }
    };
    window.addEventListener('vf-event', onUpdate);
    return () => window.removeEventListener('vf-event', onUpdate);
  }, []);

  const cid = selectedChallenge?.id;
  const scores = cid ? (board[cid] || []) : [];

  return (
    <div>
      <h3>Leaderboard</h3>
      {!cid ? <p className="small">Select a challenge to view scores.</p> : (
        <div className="list">
          {scores.length === 0 ? (
            <div className="row"><div className="title">No scores yet</div><div /></div>
          ) : scores.map((s, i) => (
            <div key={s.at} className="row">
              <div className="title">#{i+1} {s.player}</div>
              <div className="meta">{s.time.toFixed(2)}s</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
