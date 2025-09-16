import React, { useState } from 'react';
import { useGameStore } from '../state/gameStore';

// PUBLIC_INTERFACE
export default function EquationInput() {
  /** Equation input component with validation feedback. */
  const { equations, setEquations, compileEquations } = useGameStore();
  const [errors, setErrors] = useState({ x: '', y: '' });

  const onChange = (axis) => (e) => {
    const next = { ...equations, [axis]: e.target.value };
    setEquations(next);
  };

  const validate = () => {
    try {
      compileEquations();
      setErrors({ x: '', y: '' });
      alert('Equations valid!');
    } catch (e) {
      const msg = String(e.message || e);
      // naive axis detection
      if (msg.includes('x')) setErrors((s)=>({ ...s, x: msg }));
      if (msg.includes('y')) setErrors((s)=>({ ...s, y: msg }));
      if (!msg.includes('x') && !msg.includes('y')) {
        setErrors({ x: msg, y: msg });
      }
    }
  };

  return (
    <div className="panel">
      <h3>Equations</h3>
      <div className="controls">
        <div className="control-row">
          <label htmlFor="eq-x">dx/dt</label>
          <input id="eq-x" type="text" value={equations.x} onChange={onChange('x')} placeholder="dx/dt = y" />
        </div>
        {errors.x && <div style={{ color: '#c0392b', fontSize: 12 }}>{errors.x}</div>}
        <div className="control-row">
          <label htmlFor="eq-y">dy/dt</label>
          <input id="eq-y" type="text" value={equations.y} onChange={onChange('y')} placeholder="dy/dt = -x" />
        </div>
        {errors.y && <div style={{ color: '#c0392b', fontSize: 12 }}>{errors.y}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={validate}>Validate</button>
        </div>
      </div>
    </div>
  );
}
