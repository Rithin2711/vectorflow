import React, { useState, useEffect } from 'react';
import { parseEquationStrings } from '../utils/equationParser';

// PUBLIC_INTERFACE
export default function EquationInput({ initialFx, initialFy, onApply, error }) {
  /** Render inputs for ODE components and validate them before applying. */
  const [fx, setFx] = useState(initialFx || 'y');
  const [fy, setFy] = useState(initialFy || '-x');
  const [localError, setLocalError] = useState('');

  useEffect(() => { setFx(initialFx || ''); }, [initialFx]);
  useEffect(() => { setFy(initialFy || ''); }, [initialFy]);

  const validate = () => {
    try {
      parseEquationStrings(fx, fy); // will throw if invalid
      setLocalError('');
      return true;
    } catch (e) {
      setLocalError(e.message || 'Invalid equation.');
      return false;
    }
  };

  const handleApply = () => {
    if (!validate()) return;
    onApply(fx, fy);
  };

  return (
    <div>
      <label className="label" htmlFor="fx">dx/dt = f(x,y)</label>
      <input id="fx" className="input" value={fx} onChange={(e) => setFx(e.target.value)} placeholder="e.g., y + sin(x)" />
      <label className="label" htmlFor="fy" style={{marginTop: 8}}>dy/dt = g(x,y)</label>
      <input id="fy" className="input" value={fy} onChange={(e) => setFy(e.target.value)} placeholder="e.g., -x" />
      {(localError || error) && <div className="helper" style={{color: 'var(--danger)', marginTop: 6}}>{localError || error}</div>}
      <div className="controls-row" style={{marginTop: 10}}>
        <button className="btn" onClick={handleApply}>Apply</button>
        <button className="btn secondary" onClick={() => { setFx('y'); setFy('-x'); }}>Reset to Default</button>
      </div>
      <div className="helper" style={{marginTop: 6}}>
        Supported: +, -, *, /, ^, sin, cos, tan, exp, log, sqrt. Variables: x, y, t.
      </div>
    </div>
  );
}
