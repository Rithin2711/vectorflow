import React, { useState, useCallback } from 'react';
import EquationInput from '../components/EquationInput';
import SimulationControls from '../components/SimulationControls';
import FieldCanvas from '../components/FieldCanvas';
import VectorFieldPlot from '../components/VectorFieldPlot';
import HUD from '../components/HUD';

// PUBLIC_INTERFACE
export default function GamePage() {
  /** Main game page with three-column layout. */
  const [running, setRunning] = useState(false);
  const [integrator, setIntegrator] = useState('rk4');

  const onStart = useCallback((intg) => { setIntegrator(intg); setRunning(true); }, []);
  const onStop = useCallback(() => setRunning(false), []);
  const onReset = useCallback(() => { setRunning(false); }, []);

  return (
    <>
      <section className="panel">
        <h3 style={{ marginBottom: 8 }}>How to Play</h3>
        <p>Enter differential equations for dx/dt and dy/dt, visualize the vector field, and guide the particle to the target while avoiding obstacles.</p>
      </section>
      <section className="main">
        <div>
          <SimulationControls onStart={onStart} onStop={onStop} onReset={onReset} />
          <div className="panel" style={{ marginTop: 12 }}>
            <h3>Challenge Modes</h3>
            <ul>
              <li>Reach the target in minimum time</li>
              <li>Avoid collisions for 30s</li>
              <li>Pass through checkpoints</li>
            </ul>
            <p>Note: Advanced challenge logic can be added or fetched from backend in the future.</p>
          </div>
        </div>
        <div>
          <FieldCanvas running={running} setRunning={setRunning} integrator={integrator} />
          {/* Place equation input directly below the main visualization area */}
          <EquationInput />
          <VectorFieldPlot />
        </div>
        <div>
          <HUD onReset={onReset} />
        </div>
      </section>
    </>
  );
}
