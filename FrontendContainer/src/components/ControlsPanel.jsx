import React from 'react';
import useGameStore from '../store/store';

// PUBLIC_INTERFACE
export default function ControlsPanel() {
  /** Controls for play/pause, reset, challenge toggle, and simulation speed. */
  const {
    playing, setPlaying, resetSimulation,
    challengeMode, setChallengeMode,
    speed, setSpeed
  } = useGameStore();

  return (
    <div style={{ marginTop: 12 }}>
      <div className="row">
        <button className="button" onClick={() => setPlaying(!playing)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="button secondary" onClick={resetSimulation}>Reset</button>
        <label className="badge">Challenge Mode</label>
        <input type="checkbox" checked={challengeMode} onChange={(e) => setChallengeMode(e.target.checked)} />
        <label className="badge" style={{ marginLeft: 12 }}>
          Speed: {speed.toFixed(2)}x
        </label>
        <input
          className="select"
          type="range"
          min="0.25" max="4" step="0.25"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          style={{ width: 200 }}
        />
      </div>
    </div>
  );
}
```

Explanation: Game HUD showing status and basic stats.
````write file="vectorflow/FrontendContainer/src/components/GameHUD.jsx"
import React from 'react';
import useGameStore from '../store/store';

// PUBLIC_INTERFACE
export default function GameHUD() {
  /** Heads-up display for game state, score, and mode information. */
  const { playing, challengeMode, score, timeElapsed, collisions } = useGameStore();

  return (
    <div className="hud">
      <div className="badge">Status: {playing ? 'Playing' : 'Paused'}</div>
      <div className="badge">Mode: {challengeMode ? 'Challenge' : 'Free'}</div>
      <div className="badge">Score: {score}</div>
      <div className="badge">Time: {timeElapsed.toFixed(1)}s</div>
      <div className="badge">Collisions: {collisions}</div>
    </div>
  );
}
