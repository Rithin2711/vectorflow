import React, { useState } from 'react';
import EquationInput from '../components/EquationInput';
import ControlsPanel from '../components/ControlsPanel';
import VectorFieldCanvas from '../components/VectorFieldCanvas';
import GameHUD from '../components/GameHUD';
import '../styles/play.css';
import useGameStore from '../store/store';

// PUBLIC_INTERFACE
export default function Play() {
  /** Play page: provides equation input, controls, and the simulation/game canvas. */
  const { challengeMode } = useGameStore();
  const [error, setError] = useState(null);

  return (
    <div className="play grid-2">
      <div className="panel">
        <h2>Vector Field and ODE</h2>
        <EquationInput onError={setError} />
        {error && <div className="error">{error}</div>}
        <ControlsPanel />
      </div>
      <div className="panel canvas-panel">
        <GameHUD />
        <VectorFieldCanvas key={`mode-${challengeMode ? 'challenge' : 'free'}`} />
      </div>
    </div>
  );
}
