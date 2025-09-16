import React, { useState } from 'react';
import { useGameStore } from '../state/gameStore';

// PUBLIC_INTERFACE
export default function SimulationControls({ onStart, onStop, onReset }) {
  /** Controls for simulation runtime and bounds. */
  const { bounds, setBounds, dt, setDt, speed, setSpeed, difficulty, setDifficulty, samples, setSamples } = useGameStore();
  const [integrator, setIntegrator] = useState('rk4');

  const onChangeBounds = (key) => (e) => {
    const v = Number(e.target.value);
    setBounds({ ...bounds, [key]: v });
  };

  return (
    <div className="panel">
      <h3>Simulation</h3>
      <div className="controls">
        <div className="control-row">
          <label>Integrator</label>
          <select aria-label="Integrator method" value={integrator} onChange={(e)=>setIntegrator(e.target.value)}>
            <option value="rk4">RK4</option>
            <option value="euler">Euler</option>
          </select>
        </div>
        <div className="control-row">
          <label>dt</label>
          <input type="number" step="0.001" value={dt} onChange={(e)=>setDt(Number(e.target.value))} />
        </div>
        <div className="control-row">
          <label>Speed</label>
          <input type="number" step="0.1" value={speed} onChange={(e)=>setSpeed(Number(e.target.value))} />
        </div>
        <div className="control-row">
          <label>Samples</label>
          <input type="number" min="5" max="60" value={samples} onChange={(e)=>setSamples(Number(e.target.value))} />
        </div>
        <div className="control-row">
          <label>Difficulty</label>
          <select value={difficulty} onChange={(e)=>setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <h4>Bounds</h4>
        <div className="control-row"><label htmlFor="bounds-xmin">xMin</label><input id="bounds-xmin" aria-label="xMin bound" type="number" value={bounds.xMin} onChange={onChangeBounds('xMin')} /></div>
        <div className="control-row"><label htmlFor="bounds-xmax">xMax</label><input id="bounds-xmax" aria-label="xMax bound" type="number" value={bounds.xMax} onChange={onChangeBounds('xMax')} /></div>
        <div className="control-row"><label htmlFor="bounds-ymin">yMin</label><input id="bounds-ymin" aria-label="yMin bound" type="number" value={bounds.yMin} onChange={onChangeBounds('yMin')} /></div>
        <div className="control-row"><label htmlFor="bounds-ymax">yMax</label><input id="bounds-ymax" aria-label="yMax bound" type="number" value={bounds.yMax} onChange={onChangeBounds('yMax')} /></div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={()=>onStart(integrator)}>Start</button>
          <button className="btn secondary" onClick={onStop}>Stop</button>
          <button className="btn danger" onClick={onReset}>Reset</button>
        </div>
      </div>
    </div>
  );
}
