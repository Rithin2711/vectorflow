import React from 'react';

// PUBLIC_INTERFACE
export default function Help() {
  /** Help page describing equation syntax and gameplay basics. */
  return (
    <div className="panel">
      <h2>How it works</h2>
      <p>
        Define a 2D vector field F(x,y,t) = (Fx, Fy). The particle evolves via ODE: dx/dt = Fx, dy/dt = Fy.
        Use variables x, y, and t in your expressions. Constants are supported.
      </p>
      <h3>Examples</h3>
      <ul>
        <li>Uniform flow: Fx = 1, Fy = 0</li>
        <li>Rotational: Fx = -y, Fy = x</li>
        <li>Sink: Fx = -x, Fy = -y</li>
        <li>Time-dependent: Fx = sin(t) - y, Fy = cos(t) + x</li>
      </ul>
      <h3>Controls</h3>
      <ul>
        <li>Play/Pause simulation</li>
        <li>Reset particle to starting position</li>
        <li>Toggle challenge mode to enable goal and obstacles</li>
      </ul>
      <h3>Docs</h3>
      <p>
        Backend integration via API endpoints is stubbed. Set REACT_APP_API_BASE_URL to enable future connectivity.
      </p>
    </div>
  );
}
