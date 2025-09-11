import React, { useEffect, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { submitScore, fetchLeaderboard } from '../services/api';

// PUBLIC_INTERFACE
export default function Leaderboard() {
  /** Show top local and (stubbed) remote scores. */
  const [localBoard, setLocalBoard] = useLocalStorage('fq_leaderboard', []);
  const [remoteBoard, setRemoteBoard] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchLeaderboard().then(data => {
      if (mounted) setRemoteBoard(data || []);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const addDummy = () => {
    const s = {
      name: 'Guest',
      score: Math.floor(500 + Math.random() * 500),
      date: new Date().toISOString()
    };
    const updated = [...localBoard, s].sort((a, b) => b.score - a.score).slice(0, 10);
    setLocalBoard(updated);
    submitScore(s).catch(() => {});
  };

  return (
    <div>
      <div className="label">Local Top 10</div>
      <table className="table">
        <thead>
          <tr><th>Name</th><th>Score</th><th>Date</th></tr>
        </thead>
        <tbody>
          {localBoard.map((r, idx) => (
            <tr key={idx}>
              <td>{r.name}</td>
              <td>{r.score}</td>
              <td>{new Date(r.date).toLocaleString()}</td>
            </tr>
          ))}
          {localBoard.length === 0 && <tr><td colSpan={3} className="helper">No scores yet.</td></tr>}
        </tbody>
      </table>

      <div className="label" style={{marginTop: 10}}>Global (stub)</div>
      <table className="table">
        <thead>
          <tr><th>Name</th><th>Score</th><th>Date</th></tr>
        </thead>
        <tbody>
          {remoteBoard.map((r, idx) => (
            <tr key={idx}>
              <td>{r.name}</td>
              <td>{r.score}</td>
              <td>{new Date(r.date).toLocaleString()}</td>
            </tr>
          ))}
          {remoteBoard.length === 0 && <tr><td colSpan={3} className="helper">Backend not connected.</td></tr>}
        </tbody>
      </table>

      <div className="controls-row" style={{marginTop: 8}}>
        <button className="btn" onClick={addDummy}>Add Random Local Score</button>
      </div>
    </div>
  );
}
