import React, { useEffect, useRef } from 'react';
import { distance, clamp } from '../utils/math';
import { logEvent } from '../services/logging';

/**
 * VectorFieldCanvas renders an interactive HTML5 canvas with:
 * - vector field arrows sampled on a grid
 * - current particle position and trajectory
 * - target and obstacles
 * - click-to-move behavior via onCanvasClick callback
 */

// PUBLIC_INTERFACE
export default function VectorFieldCanvas({
  bounds, fieldFn, position, target, obstacles, trajectory,
  isRunning, onCanvasClick, onReachTarget
}) {
  /** This is a public function component providing interactive visualization. */
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  const draw = (ctx, w, h) => {
    // Clear
    ctx.clearRect(0, 0, w, h);

    // Bg grid
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, w, h);

    const { xmin, xmax, ymin, ymax } = bounds;
    const toPx = (x, y) => {
      const px = ((x - xmin) / (xmax - xmin)) * w;
      const py = h - ((y - ymin) / (ymax - ymin)) * h;
      return [px, py];
    };
    const toWorld = (px, py) => {
      const x = xmin + (px / w) * (xmax - xmin);
      const y = ymin + ((h - py) / h) * (ymax - ymin);
      return [x, y];
    };

    // Draw axes
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // y=0
    const [x0, y0p] = toPx(xmin, 0);
    const [x1, y1p] = toPx(xmax, 0);
    ctx.moveTo(x0, y0p); ctx.lineTo(x1, y1p);
    // x=0
    const [x0p, y0] = toPx(0, ymin);
    const [x1p, y1] = toPx(0, ymax);
    ctx.moveTo(x0p, y0); ctx.lineTo(x1p, y1);
    ctx.stroke();

    // Vector field arrows
    const grid = 18; // number of samples per axis
    for (let i = 0; i <= grid; i++) {
      for (let j = 0; j <= grid; j++) {
        const x = xmin + (i / grid) * (xmax - xmin);
        const y = ymin + (j / grid) * (ymax - ymin);
        const v = fieldFn(x, y, 0);
        if (!isFinite(v.vx) || !isFinite(v.vy)) continue;
        // normalize arrow length for display
        const len = Math.hypot(v.vx, v.vy) || 1e-6;
        const scale = 0.4 * Math.min((xmax - xmin) / grid, (ymax - ymin) / grid);
        const vx = (v.vx / len) * scale;
        const vy = (v.vy / len) * scale;
        const [px, py] = toPx(x, y);
        const [px2, py2] = toPx(x + vx, y + vy);

        ctx.strokeStyle = 'rgba(154,179,255,0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px2, py2);
        ctx.stroke();

        // arrow head
        const angle = Math.atan2(py2 - py, px2 - px);
        ctx.beginPath();
        ctx.moveTo(px2, py2);
        ctx.lineTo(px2 - 6 * Math.cos(angle - Math.PI / 6), py2 - 6 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(px2 - 6 * Math.cos(angle + Math.PI / 6), py2 - 6 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = 'rgba(154,179,255,0.85)';
        ctx.fill();
      }
    }

    // Draw obstacles
    for (const obs of obstacles) {
      const [opx, opy] = toPx(obs.x, obs.y);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,93,93,0.7)';
      ctx.arc(opx, opy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,93,93,0.9)';
      ctx.stroke();
    }

    // Draw target
    if (target) {
      const [tx, ty] = toPx(target.x, target.y);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(54,211,153,0.9)';
      ctx.fillStyle = 'rgba(54,211,153,0.2)';
      ctx.lineWidth = 2;
      ctx.arc(tx, ty, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Draw trajectory
    if (trajectory.length > 1) {
      ctx.beginPath();
      ctx.lineWidth = 2;
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#9ab3ff');
      grad.addColorStop(1, '#ff8a45');
      ctx.strokeStyle = grad;
      const [sx, sy] = toPx(trajectory[0].x, trajectory[0].y);
      ctx.moveTo(sx, sy);
      for (let k = 1; k < trajectory.length; k++) {
        const [px, py] = toPx(trajectory[k].x, trajectory[k].y);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Draw particle
    if (position) {
      const [px, py] = toPx(position.x, position.y);
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4562ff';
      ctx.stroke();
    }

    // Reach check and collision indicators
    if (target && position && distance(position, target) < 0.3 && !isRunning) {
      ctx.fillStyle = 'rgba(54,211,153,0.85)';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Target reached! Resume to try again.', 10, 24);
      if (onReachTarget) onReachTarget(Math.max(0, Math.floor(1000 - trajectory.length)));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // Scale for device pixel ratio
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor((rect.height || 480) * dpr);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, rect.width, rect.height || 480);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds, fieldFn, position, trajectory, target, obstacles, isRunning]);

  // minimal RAF to refresh when running to give sense of motion (trajectory updates happen in hook)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const prefersReduced = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderOnce = () => {
      const rect = canvas.getBoundingClientRect();
      draw(ctx, rect.width, rect.height || 480);
    };

    const loop = () => {
      renderOnce();
      requestRef.current = requestAnimationFrame(loop);
    };

    if (isRunning && !prefersReduced) {
      requestRef.current = requestAnimationFrame(loop);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      // draw once to display any end-state messages or static frame
      renderOnce();
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = clamp(e.clientX - rect.left, 0, rect.width);
    const py = clamp(e.clientY - rect.top, 0, rect.height);

    const { xmin, xmax, ymin, ymax } = bounds;
    const x = xmin + (px / rect.width) * (xmax - xmin);
    const y = ymin + ((rect.height - py) / rect.height) * (ymax - ymin);

    logEvent('canvas_click', { px, py, x, y });
    if (onCanvasClick) onCanvasClick(x, y);
  };

  return (
    <div className="canvas-area">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onClick={handleClick}
      />
    </div>
  );
}
