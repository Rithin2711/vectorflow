/**
 * Math utilities for VectorFlow.
 * Includes parser for user equations, field evaluators, ODE integrators, collision detection.
 */

// PUBLIC_INTERFACE
export function safeEvalExpr(expr, vars) {
  /**
   * Safely evaluate a math expression string with variables.
   * Supports Math.* functions and basic operators.
   */
  // eslint-disable-next-line no-new-func
  const fn = new Function(
    'x','y','t','Math',
    `"use strict"; return (${expr});`
  );
  return fn(vars.x, vars.y, vars.t, Math);
}

// PUBLIC_INTERFACE
export function makeFieldFromEquations(ex, ey) {
  /**
   * Create a vector field function F(x,y,t) -> {fx, fy}
   */
  return (x, y, t) => {
    const vars = { x, y, t };
    let fx = 0, fy = 0;
    try {
      fx = safeEvalExpr(ex, vars);
      fy = safeEvalExpr(ey, vars);
      if (!Number.isFinite(fx) || !Number.isFinite(fy)) return { fx: 0, fy: 0 };
    } catch {
      return { fx: 0, fy: 0 };
    }
    return { fx, fy };
  };
}

// PUBLIC_INTERFACE
export function eulerStep(pos, dt, field, t) {
  /** Simple Euler integrator step. */
  const f = field(pos.x, pos.y, t);
  return { x: pos.x + dt * f.fx, y: pos.y + dt * f.fy };
}

// PUBLIC_INTERFACE
export function rk4Step(pos, dt, field, t) {
  /** Classic RK4 step for improved stability. */
  const f = (p, tt) => field(p.x, p.y, tt);
  const k1 = f(pos, t);
  const k2 = f({ x: pos.x + 0.5*dt*k1.fx, y: pos.y + 0.5*dt*k1.fy }, t + 0.5*dt);
  const k3 = f({ x: pos.x + 0.5*dt*k2.fx, y: pos.y + 0.5*dt*k2.fy }, t + 0.5*dt);
  const k4 = f({ x: pos.x + dt*k3.fx, y: pos.y + dt*k3.fy }, t + dt);
  const dx = dt*(k1.fx + 2*k2.fx + 2*k3.fx + k4.fx)/6;
  const dy = dt*(k1.fy + 2*k2.fy + 2*k3.fy + k4.fy)/6;
  return { x: pos.x + dx, y: pos.y + dy };
}

// PUBLIC_INTERFACE
export function clamp(v, min, max) {
  /** Clamp helper */
  return Math.max(min, Math.min(max, v));
}

// PUBLIC_INTERFACE
export function detectCollision(circle, rects) {
  /**
   * Detect collision between a circle and a list of axis-aligned rectangles.
   * circle: {x, y, r}
   * rect: {x, y, w, h}
   */
  for (const r of rects) {
    const cx = clamp(circle.x, r.x, r.x + r.w);
    const cy = clamp(circle.y, r.y, r.y + r.h);
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    if (dx*dx + dy*dy <= circle.r*circle.r) return true;
  }
  return false;
}

// PUBLIC_INTERFACE
export function hitTarget(circle, target) {
  /** Check collision with target circle. */
  const dx = circle.x - target.x;
  const dy = circle.y - target.y;
  return (dx*dx + dy*dy) <= (circle.r + target.r) * (circle.r + target.r);
}

// PUBLIC_INTERFACE
export function defaultChallenges() {
  /** Returns a list of built-in challenges. */
  return [
    {
      id: 'c1',
      name: 'Straight Flow',
      description: 'Guide the particle in a constant vector field to reach the target.',
      ex: '1',
      ey: '0',
      start: { x: 20, y: 120 },
      target: { x: 520, y: 120, r: 14 },
      obstacles: [],
      bounds: { x: 0, y: 0, w: 560, h: 240 },
      timeLimit: 20
    },
    {
      id: 'c2',
      name: 'Rotational Field',
      description: 'Circular field: F = (-y, x). Reach the target avoiding the center.',
      ex: '-y',
      ey: 'x',
      start: { x: 70, y: 60 },
      target: { x: 500, y: 180, r: 14 },
      obstacles: [{ x: 240, y: 90, w: 80, h: 60 }],
      bounds: { x: 0, y: 0, w: 560, h: 240 },
      timeLimit: 30
    },
    {
      id: 'c3',
      name: 'Saddle',
      description: 'Saddle field: F = (x, -y).',
      ex: 'x',
      ey: '-y',
      start: { x: 30, y: 30 },
      target: { x: 520, y: 200, r: 14 },
      obstacles: [{ x: 200, y: 60, w: 40, h: 120 }, { x: 340, y: 0, w: 40, h: 120 }],
      bounds: { x: 0, y: 0, w: 560, h: 240 },
      timeLimit: 35
    }
  ];
}
