import React, { useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { submitScore } from '../utils/api';

// PUBLIC_INTERFACE
export default function HUD({ onReset }) {
  const { player, setPlayerName, addLeaderboard } = useGameStore();
  const [score, setScore] = useState(0);

  const submit = async () => {
    const entry = { name: player.name, score, date: new Date().toISOString() };
    addLeaderboard(entry);
    await submitScore(entry); // best-effort submit
    // eslint-disable-next-line no-alert
    alert('Score saved locally' + (process.env.REACT_APP_BACKEND_URL ? ' and submitted to backend.' : '.'));
    onReset?.();
  };

  return (
    <div className="panel">
      <h3>Player</h3>
      <div className="controls">
        <div className="control-row">
          <label>Name</label>
          <input type="text" value={player.name} onChange={(e)=>setPlayerName(e.target.value)} />
        </div>
        <div className="control-row">
          <label>Score</label>
          <input type="number" value={score} onChange={(e)=>setScore(Number(e.target.value))} />
        </div>
        <div>
          <button className="btn" onClick={submit}>Save Score</button>
        </div>
      </div>
    </div>
  );
}
