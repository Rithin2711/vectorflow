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
