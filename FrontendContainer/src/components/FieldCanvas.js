import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { eulerStep, rk4Step } from '../utils/equations';

const COLORS = {
  gridMajor: 'rgba(90, 100, 120, 0.25)',
  gridMinor: 'rgba(90, 100, 120, 0.12)',
  axes: '#5b6bff',
  ticks: 'rgba(90, 100, 120, 0.8)',
  labels: 'rgba(90, 100, 120, 0.9)',
  field: '#7f8c8d',
  particle: '#e67e22',
  particleStroke: '#ffffff',
  trail: '#3498db',
  obstacleFill: 'rgba(192, 57, 43, 0.18)',
  obstacleStroke: '#c0392b',
  targetFill: 'rgba(46, 204, 113, 0.22)',
  targetStroke: '#2ecc71',
};

function mapToCanvas(x, y, bounds, width, height) {
  const { xMin, xMax, yMin, yMax } = bounds;
  const cx = ((x - xMin) / (xMax - xMin)) * width;
  const cy = height - ((y - yMin) / (yMax - yMin)) * height; // invert y
  return [cx, cy];
}

function niceStep(range) {
  // choose a human-friendly step size for ticks given a numeric range
  const approx = range / 10;
  const pow10 = Math.pow(10, Math.floor(Math.log10(Math.max(approx, 1e-6))));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * pow10);
  let best = candidates[0];
  for (const c of candidates) {
    if (Math.abs(c - approx) < Math.abs(best - approx)) best = c;
  }
  return best;
}

function drawGridAndAxes(ctx, bounds, width, height) {
  const { xMin, xMax, yMin, yMax } = bounds;

  // Draw graph-paper style grid: minor + major lines
  ctx.save();
  ctx.lineWidth = 1;

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  const xStepMajor = niceStep(xRange);
  const yStepMajor = niceStep(yRange);
  const xStepMinor = xStepMajor / 5;
  const yStepMinor = yStepMajor / 5;

  // Minor verticals
  ctx.strokeStyle = COLORS.gridMinor;
  for (let x = Math.ceil(xMin / xStepMinor) * xStepMinor; x <= xMax; x += xStepMinor) {
    const [cx] = mapToCanvas(x, 0, bounds, width, height);
    ctx.beginPath();
    ctx.moveTo(Math.round(cx) + 0.5, 0);
    ctx.lineTo(Math.round(cx) + 0.5, height);
    ctx.stroke();
  }
  // Minor horizontals
  for (let y = Math.ceil(yMin / yStepMinor) * yStepMinor; y <= yMax; y += yStepMinor) {
    const [, cy] = mapToCanvas(0, y, bounds, width, height);
    ctx.beginPath();
    ctx.moveTo(0, Math.round(cy) + 0.5);
    ctx.lineTo(width, Math.round(cy) + 0.5);
    ctx.stroke();
  }

  // Major verticals
  ctx.strokeStyle = COLORS.gridMajor;
  for (let x = Math.ceil(xMin / xStepMajor) * xStepMajor; x <= xMax; x += xStepMajor) {
    const [cx] = mapToCanvas(x, 0, bounds, width, height);
    ctx.beginPath();
    ctx.moveTo(Math.round(cx) + 0.5, 0);
    ctx.lineTo(Math.round(cx) + 0.5, height);
    ctx.stroke();
  }
  // Major horizontals
  for (let y = Math.ceil(yMin / yStepMajor) * yStepMajor; y <= yMax; y += yStepMajor) {
    const [, cy] = mapToCanvas(0, y, bounds, width, height);
    ctx.beginPath();
    ctx.moveTo(0, Math.round(cy) + 0.5);
    ctx.lineTo(width, Math.round(cy) + 0.5);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = COLORS.axes;
  ctx.lineWidth = 1.5;
  // y = 0 axis (x-axis)
  if (yMin < 0 && yMax > 0) {
    const [, cy0] = mapToCanvas(0, 0, bounds, width, height);
    ctx.beginPath();
    ctx.moveTo(0, Math.round(cy0) + 0.5);
    ctx.lineTo(width, Math.round(cy0) + 0.5);
    ctx.stroke();
  }
  // x = 0 axis (y-axis)
  if (xMin < 0 && xMax > 0) {
    const [cx0] = mapToCanvas(0, 0, bounds, width, height);
    ctx.beginPath();
    ctx.moveTo(Math.round(cx0) + 0.5, 0);
    ctx.lineTo(Math.round(cx0) + 0.5, height);
    ctx.stroke();
  }

  // Ticks and labels on axes
  ctx.fillStyle = COLORS.labels;
  ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.strokeStyle = COLORS.ticks;
  ctx.lineWidth = 1;

  // x-axis ticks (y=0)
  if (yMin < 0 && yMax > 0) {
    const [, cy0] = mapToCanvas(0, 0, bounds, width, height);
    for (let x = Math.ceil(xMin / xStepMajor) * xStepMajor; x <= xMax; x += xStepMajor) {
      const [cx] = mapToCanvas(x, 0, bounds, width, height);
      ctx.beginPath();
      ctx.moveTo(Math.round(cx) + 0.5, Math.round(cy0) - 4.5);
      ctx.lineTo(Math.round(cx) + 0.5, Math.round(cy0) + 4.5);
      ctx.stroke();
      ctx.fillText(Number.isInteger(x) ? `${x}` : `${+x.toFixed(2)}`, cx, cy0 + 6);
    }
  }

  // y-axis ticks (x=0)
  if (xMin < 0 && xMax > 0) {
    const [cx0] = mapToCanvas(0, 0, bounds, width, height);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.ceil(yMin / yStepMajor) * yStepMajor; y <= yMax; y += yStepMajor) {
      const [, cy] = mapToCanvas(0, y, bounds, width, height);
      ctx.beginPath();
      ctx.moveTo(Math.round(cx0) - 4.5, Math.round(cy) + 0.5);
      ctx.lineTo(Math.round(cx0) + 4.5, Math.round(cy) + 0.5);
      ctx.stroke();
      if (y !== 0) {
        ctx.fillText(Number.isInteger(y) ? `${y}` : `${+y.toFixed(2)}`, cx0 - 6, cy);
      }
    }
  }

  // axis labels
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('x', width - 8, 6);
  ctx.save();
  ctx.translate(10, 14);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('y', 0, 0);
  ctx.restore();

  ctx.restore();
}

function drawArrow(ctx, x1, y1, x2, y2) {
  // simple arrowhead for field vectors
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(x2, y2);
  ctx.fill();
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

  const inflate = difficulty === 'hard' ? 1.2 : difficulty === 'easy' ? 0.8 : 1.0;

  const draw = (ctx, size) => {
    const { width, height } = size;
    ctx.clearRect(0, 0, width, height);

    // grid and axes
    drawGridAndAxes(ctx, bounds, width, height);

    // draw field arrows
    let compiled;
    try { compiled = compileEquations(); } catch (e) { compiled = null; }
    if (compiled) {
      ctx.strokeStyle = COLORS.field;
      ctx.fillStyle = COLORS.field;
      ctx.lineWidth = 1;
      const nx = samples, ny = samples;
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
          const x = bounds.xMin + (i + 0.5) * (bounds.xMax - bounds.xMin) / nx;
          const y = bounds.yMin + (j + 0.5) * (bounds.yMax - bounds.yMin) / ny;
          const vx = compiled.fx(x, y, 0);
          const vy = compiled.fy(x, y, 0);
          const len = Math.hypot(vx, vy) || 1;
          const scale = 0.25;
          const x2 = x + (vx / len) * scale;
          const y2 = y + (vy / len) * scale;
          const [cx1, cy1] = mapToCanvas(x, y, bounds, width, height);
          const [cx2, cy2] = mapToCanvas(x2, y2, bounds, width, height);
          drawArrow(ctx, cx1, cy1, cx2, cy2);
        }
      }
    }

    // obstacles
    obstacles.forEach(o => {
      if (o.type === 'circle') {
        const [cx, cy] = mapToCanvas(o.x, o.y, bounds, width, height);
        const r = (o.r / (bounds.xMax - bounds.xMin)) * width;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.obstacleFill;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = COLORS.obstacleStroke;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // target as a bullseye icon
    const [tx, ty] = mapToCanvas(target.x, target.y, bounds, width, height);
    const tr = (target.r / (bounds.xMax - bounds.xMin)) * width;
    ctx.beginPath();
    ctx.arc(tx, ty, tr, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.targetFill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.targetStroke;
    ctx.stroke();
    // inner ring + crosshair
    ctx.beginPath();
    ctx.arc(tx, ty, Math.max(2, tr * 0.5), 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.targetStroke;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx - tr, ty);
    ctx.lineTo(tx + tr, ty);
    ctx.moveTo(tx, ty - tr);
    ctx.lineTo(tx, ty + tr);
    ctx.stroke();

    // trajectory
    ctx.strokeStyle = COLORS.trail;
    ctx.lineWidth = 2;
    ctx.beginPath();
    particle.trail.forEach((p, idx) => {
      const [cx, cy] = mapToCanvas(p.x, p.y, bounds, width, height);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    // particle with outline
    const [px, py] = mapToCanvas(particle.x, particle.y, bounds, width, height);
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.particle;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.particleStroke;
    ctx.stroke();
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
      const dpr = window.devicePixelRatio || 1;
      cnv.width = Math.floor(rect.width * dpr);
      cnv.height = Math.floor(rect.height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset any prior scale
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;

      if (running) {
        const dtSim = ((now - last) / 1000) * speed;
        const steps = Math.max(1, Math.floor(dtSim / dt));
        let state = { x: particle.x, y: particle.y, t: particle.t, dt };
        let compiled;
        try { compiled = compileEquations(); } catch { compiled = null; }
        const stepFn = integrator === 'euler' ? eulerStep : rk4Step;

        for (let s = 0; s < steps; s++) {
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

      draw(ctx, { width: cnv.width / dpr, height: cnv.height / dpr });
      last = now;
      raf = requestAnimationFrame(stepSim);
    };

    raf = requestAnimationFrame(stepSim);
    return () => { if (raf) cancelAnimationFrame(raf); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, dt, speed, bounds, obstacles, target, samples, integrator, difficulty]);

  const reset = () => setParticle({ x: 0, y: 5, t: 0, trail: [] });

  return (
    <div className="panel">
      <h3>Field</h3>
      <div className="canvas-wrap" onDoubleClick={reset}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, var(--panel-bg), var(--panel-bg))' }} />
        <div className="overlay" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="legend"><span className="dot" style={{ background: COLORS.particle }} /> Particle</div>
          <div className="legend"><span className="dot" style={{ background: COLORS.obstacleStroke }} /> Obstacles</div>
          <div className="legend"><span className="dot" style={{ background: COLORS.targetStroke }} /> Target</div>
        </div>
      </div>
    </div>
  );
}
