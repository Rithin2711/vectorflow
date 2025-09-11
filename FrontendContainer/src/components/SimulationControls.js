import React, { useState } from 'react';

// PUBLIC_INTERFACE
export default function SimulationControls({
  isRunning, onStart, onPause, onReset, onStep,
  dt, setDt, bounds, setBounds
}) {
  /** Simulation controls: play/pause/step, timestep adjustment, and world bounds. */
  const [localBounds, setLocalBounds] = useState(bounds);

  const applyBounds = () => {
    const b = {
      xmin: Number(localBounds.xmin),
      xmax: Number(localBounds.xmax),
      ymin: Number(localBounds.ymin),
      ymax: Number(localBounds.ymax),
    };
    // simple sanity
    if (isFinite(b.xmin) && isFinite(b.xmax) && b.xmax > b.xmin &&
        isFinite(b.ymin) && isFinite(b.ymax) && b.ymax > b.ymin) {
      setBounds(b);
    }
  };

  return (
    <div>
      <div className="controls-row">
        {!isRunning ? (
          <button className="btn success" onClick={onStart}>Start</button>
        ) : (
          <button className="btn danger" onClick={onPause}>Pause</button>
        )}
        <button className="btn secondary" onClick={onReset}>Reset</button>
        <button className="btn" onClick={onStep} disabled={isRunning}>Step</button>
      </div>

      <hr className="soft" />

      <div className="label">Time step (dt): {dt.toFixed(3)}</div>
      <input
        type="range" min="0.001" max="0.1" step="0.001"
        value={dt} onChange={(e) => setDt(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />

      <hr className="soft" />

      <div className="label">Bounds</div>
      <div className="controls-row">
        <input className="input" type="number" step="0.5" value={localBounds.xmin} onChange={(e) => setLocalBounds(lb => ({ ...lb, xmin: e.target.value }))} />
        <input className="input" type="number" step="0.5" value={localBounds.xmax} onChange={(e) => setLocalBounds(lb => ({ ...lb, xmax: e.target.value }))} />
      </div>
      <div className="controls-row" style={{ marginTop: 6 }}>
        <input className="input" type="number" step="0.5" value={localBounds.ymin} onChange={(e) => setLocalBounds(lb => ({ ...lb, ymin: e.target.value }))} />
        <input className="input" type="number" step="0.5" value={localBounds.ymax} onChange={(e) => setLocalBounds(lb => ({ ...lb, ymax: e.target.value }))} />
      </div>
      <div className="controls-row" style={{ marginTop: 8 }}>
        <button className="btn" onClick={applyBounds}>Apply</button>
      </div>
    </div>
  );
}
