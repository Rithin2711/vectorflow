import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { parseVectorField } from '../utils/parser';
import useGameStore from '../store/store';

// PUBLIC_INTERFACE
export default function EquationInput({ onError }) {
  /**
   * Provides input fields for Fx and Fy equation, parses and updates global store.
   * PUBLIC_INTERFACE: Component for entering vector field equations.
   */
  const { fieldExpr, setFieldExpr, setParsedField } = useGameStore();
  const [fx, setFx] = useState(fieldExpr.fx);
  const [fy, setFy] = useState(fieldExpr.fy);
  const [err, setErr] = useState(null);

  const compiled = useMemo(() => {
    try {
      const parsed = parseVectorField({ fx, fy });
      setErr(null);
      onError?.(null);
      return parsed;
    } catch (e) {
      setErr(e.message);
      onError?.(e.message);
      return null;
    }
  }, [fx, fy, onError]);

  useEffect(() => {
    setFieldExpr({ fx, fy });
    if (compiled) setParsedField(compiled);
  }, [fx, fy, compiled, setFieldExpr, setParsedField]);

  return (
    <div>
      <div className="row">
        <label style={{ minWidth: 40 }}>Fx</label>
        <input className="input" value={fx} onChange={(e) => setFx(e.target.value)} placeholder="-y" />
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <label style={{ minWidth: 40 }}>Fy</label>
        <input className="input" value={fy} onChange={(e) => setFy(e.target.value)} placeholder="x" />
      </div>
      <div style={{ marginTop: 6 }}>
        <small className="badge">Variables: x, y, t</small>
      </div>
      {err && <div style={{ color: 'var(--warning)', marginTop: 8 }}>{err}</div>}
    </div>
  );
}

EquationInput.propTypes = {
  onError: PropTypes.func
};
