import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { eulerStep, rk4Step } from '../utils/equations';

const COLORS = {
  field: '#7f8c8d',
  particle: '#e67e22',
  trail: '#3498db',
  obstacle: '#c0392b',
  target: '#2ecc71',
};

function mapToCanvas(x, y, bounds, width, height) {
  const { xMin, xMax, yMin, yMax } = bounds;
  const cx = ((x - xMin) / (xMax - xMin)) * width;
  const cy = height - ((y - yMin) / (yMax - yMin)) * height; // invert y
  return [cx, cy];
}

// PUBLIC_INTERFACE
export default function FieldCanvas({ running, setRunning, integrator }) {
  /** Canvas renderer with vector field, particle, trajectory and simple collisions. */
  const canvasRef = useRef(null);
  const { bounds, dt, speed, samples, compileEquations, difficulty } = useGameStore();
  const [particle, setParticle] = useState({ x: 0, y: 5, t: 0, trail: [] });
  const [obstacles] = useState([
    { id: 'o1', type: 'circle', x: -2, y: 0, r: 1.8 },
    { id: 'o2', type: 'circle', x: 3, y: 3, r: 1.2 },
  ]);
  const [target] = useState({ x: 8, y: -4, r: 1.2 });

  // Difficulty adjusts collision radius subtly
  const inflate = difficulty === 'hard' ? 1.2 : difficulty === 'easy' ? 0.8 : 1.0;

  // Draw grid/field
  const draw = (ctx, size) => {
    const { width, height } = size;
    ctx.clearRect(0,0,width,height);

    // draw field arrows
    let compiled;
    try { compiled = compileEquations(); } catch (e) { compiled = null; }
    if (compiled) {
      ctx.strokeStyle = COLORS.field;
      ctx.lineWidth = 1;
      const nx = samples, ny = samples;
      for (let i=0; i<nx; i++) {
        for (let j=0; j<ny; j++) {
          const x = bounds.xMin + (i+0.5)*(bounds.xMax - bounds.xMin)/nx;
          const y = bounds.yMin + (j+0.5)*(bounds.yMax - bounds.yMin)/ny;
          const vx = compiled.fx(x,y,0);
          const vy = compiled.fy(x,y,0);
          const len = Math.hypot(vx, vy) || 1;
          const scale = 0.2; // draw arrow short
          const x2 = x + (vx/len) * scale;
          const y2 = y + (vy/len) * scale;
          const [cx1, cy1] = mapToCanvas(x,y,bounds,width,height);
          const [cx2, cy2] = mapToCanvas(x2,y2,bounds,width,height);
          ctx.beginPath();
          ctx.moveTo(cx1, cy1);
          ctx.lineTo(cx2, cy2);
          ctx.stroke();
        }
      }
    }

    // draw obstacles
    ctx.fillStyle = COLORS.obstacle;
    obstacles.forEach(o => {
      if (o.type === 'circle') {
        const [cx, cy] = mapToCanvas(o.x, o.y, bounds, width, height);
        const r = (o.r / (bounds.xMax - bounds.xMin)) * width;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.fill();
      }
    });

    // draw target
    ctx.fillStyle = COLORS.target;
    const [tx, ty] = mapToCanvas(target.x, target.y, bounds, width, height);
    const tr = (target.r / (bounds.xMax - bounds.xMin)) * width;
    ctx.beginPath();
    ctx.arc(tx, ty, tr, 0, Math.PI*2);
    ctx.fill();

    // draw trail
    ctx.strokeStyle = COLORS.trail;
    ctx.lineWidth = 2;
    ctx.beginPath();
    particle.trail.forEach((p, idx) => {
      const [cx, cy] = mapToCanvas(p.x, p.y, bounds, width, height);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    // draw particle
    ctx.fillStyle = COLORS.particle;
    const [px, py] = mapToCanvas(particle.x, particle.y, bounds, width, height);
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI*2);
    ctx.fill();
  };

  // Sim loop
  useEffect(() => {
    let raf = null;
    let last = performance.now();

    const stepSim = (now) => {
      const cnv = canvasRef.current;
      if (!cnv) return;
      const ctx = cnv.getContext('2d');
      const rect = cnv.getBoundingClientRect();
      cnv.width = Math.floor(rect.width * window.devicePixelRatio);
      cnv.height = Math.floor(rect.height * window.devicePixelRatio);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      if (running) {
        const dtSim = ((now - last)/1000) * speed;
        const steps = Math.max(1, Math.floor(dtSim / dt));
        let state = { x: particle.x, y: particle.y, t: particle.t, dt };
        let compiled;
        try { compiled = compileEquations(); } catch { compiled = null; }
        const stepFn = integrator === 'euler' ? eulerStep : rk4Step;

        for (let s=0; s<steps; s++) {
          if (!compiled) break;
          state = stepFn(state, compiled);
          // bounds clamp
          state.x = Math.max(bounds.xMin, Math.min(bounds.xMax, state.x));
          state.y = Math.max(bounds.yMin, Math.min(bounds.yMax, state.y));
        }

        // collision with obstacles
        let hit = false;
        for (const o of obstacles) {
          if (o.type === 'circle') {
            const d = Math.hypot(state.x - o.x, state.y - o.y);
            if (d < o.r * inflate) {
              hit = true;
              break;
            }
          }
        }

        // reached target
        const reached = Math.hypot(state.x - target.x, state.y - target.y) < target.r;

        setParticle((p) => ({
          x: state.x, y: state.y, t: state.t,
          trail: [...p.trail, { x: state.x, y: state.y }].slice(-500),
        }));

        if (hit) {
          setRunning(false);
          // eslint-disable-next-line no-alert
          alert('Collision! Try adjusting your equations.');
        } else if (reached) {
          setRunning(false);
          // eslint-disable-next-line no-alert
          alert('Target reached! Great job!');
        }
      }

      draw(ctx, { width: cnv.width / window.devicePixelRatio, height: cnv.height / window.devicePixelRatio });
      last = now;
      raf = requestAnimationFrame(stepSim);
    };

    raf = requestAnimationFrame(stepSim);
    return () => { if (raf) cancelAnimationFrame(raf); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, dt, speed, bounds, obstacles, target, samples, integrator, difficulty]);

  // Reset particle
  const reset = () => setParticle({ x: 0, y: 5, t: 0, trail: [] });

  return (
    <div className="panel">
      <h3>Field</h3>
      <div className="canvas-wrap" onDoubleClick={reset}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        <div className="overlay">
          <div className="legend"><span className="dot" style={{ background: COLORS.particle }} /> Particle</div>
          <div className="legend"><span className="dot" style={{ background: COLORS.obstacle }} /> Obstacles</div>
          <div className="legend"><span className="dot" style={{ background: COLORS.target }} /> Target</div>
        </div>
      </div>
    </div>
  );
}
