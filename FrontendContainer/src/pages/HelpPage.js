import React from 'react';

// PUBLIC_INTERFACE
export default function HelpPage() {
  return (
    <section className="panel" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h3>Help</h3>
      <p>FlowQuest helps you learn about vector fields and differential equations. Define equations for dx/dt and dy/dt to move a particle in a 2D field.</p>
      <ul>
        <li>Use functions like sin, cos, exp, log, sqrt</li>
        <li>Variables: x, y, t</li>
        <li>Example: dx/dt = y, dy/dt = -x</li>
      </ul>
      <p>Double-click the canvas to reset the particle. Use the simulation controls to start/stop and change dt or integrator.</p>
      <p>Plotly view gives a 2D vector depiction. Advanced modes like Phaser/Unity scenes can be integrated via separate components.</p>
    </section>
  );
}
