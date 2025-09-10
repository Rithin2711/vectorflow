import React, { useEffect, useState } from 'react';
import { makeFieldFromEquations } from '../lib/mathUtils.js';

/**
 * PUBLIC_INTERFACE
 * EquationInput - captures f(x,y,t) and g(x,y,t) with basic validation.
 */
export default function EquationInput({ value, onChange }) {
  const [ex, setEx] = useState(value.ex);
  const [ey, setEy] = useState(value.ey);
  const [valid, setValid] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setEx(value.ex);
    setEy(value.ey);
  }, [value.ex, value.ey]);

  useEffect(() => {
    // Validate by sampling a few points
    try {
      const field = makeFieldFromEquations(ex, ey);
      const s = field(1, 2, 0.5);
      if (!Number.isFinite(s.fx) || !Number.isFinite(s.fy)) {
        setValid(false);
        setMsg('Non-finite result. Check your expressions.');
      } else {
        setValid(true);
        setMsg('OK');
      }
    } catch (e) {
      setValid(false);
      setMsg('Invalid expression');
    }
  }, [ex, ey]);

  const apply = () => {
    onChange({ ex, ey });
  };

  return (
    <>
      <div className="input-row">
        <input value={ex} onChange={(e) => setEx(e.target.value)} placeholder="f(x,y,t)" />
      </div>
      <div className="input-row">
        <input value={ey} onChange={(e) => setEy(e.target.value)} placeholder="g(x,y,t)" />
      </div>
      <div className="button-row">
        <button className="success" onClick={apply} disabled={!valid}>Apply</button>
        <span className="small" style={{ color: valid ? '#3fb950' : '#f85149' }}>{msg}</span>
      </div>
    </>
  );
}
