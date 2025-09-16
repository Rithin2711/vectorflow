import { create, all } from 'mathjs';
const math = create(all, {});

const allowedSymbols = new Set(['x','y','t','sin','cos','tan','exp','log','sqrt','abs','pi','e']);

// PUBLIC_INTERFACE
export function parseEquationSet(equations) {
  /**
   * Parses equation strings of form:
   *  x: "dx/dt = f(x,y,t)"
   *  y: "dy/dt = g(x,y,t)"
   * Returns { fx(x,y,t), fy(x,y,t) } or throws an Error with message info.
   */
  const fx = parseSingle(equations.x, 'x');
  const fy = parseSingle(equations.y, 'y');
  return { fx, fy };
}

function parseSingle(text, varName) {
  const cleaned = (text || '').replace(/\s+/g, '');
  const expectedPrefix = `d${varName}/dt=`;
  if (!cleaned.startsWith(expectedPrefix)) {
    throw new Error(`Equation must start with '${expectedPrefix}'`);
  }
  const exprStr = cleaned.substring(expectedPrefix.length);

  // Quick validation: parse with mathjs
  let node;
  try {
    node = math.parse(exprStr);
  } catch (e) {
    throw new Error(`Invalid expression for ${varName}: ${e.message}`);
  }

  // Validate symbols
  const vars = new Set();
  node.traverse((n) => {
    if (n.isSymbolNode) vars.add(n.name);
  });
  for (const v of vars) {
    if (!allowedSymbols.has(v)) {
      if (!['x','y','t'].includes(v)) {
        // Allow mathjs functions dynamically, but block assignment or unknowns
        // We'll consider unknowns invalid except variables x,y,t.
        throw new Error(`Unknown symbol '${v}' in ${varName} equation`);
      }
    }
  }

  // Create compiled function
  const compiled = node.compile();
  const fn = (x, y, t) => {
    const scope = { x, y, t, pi: Math.PI, e: Math.E, sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs, sqrt: Math.sqrt, log: Math.log, exp: Math.exp };
    const v = compiled.evaluate(scope);
    if (!Number.isFinite(v)) return 0; // safe fallback
    return Number(v);
  };

  return fn;
}

// PUBLIC_INTERFACE
export function eulerStep({ x, y, t, dt }, { fx, fy }) {
  /** Simple Euler integrator step. */
  const dx = fx(x, y, t);
  const dy = fy(x, y, t);
  return { x: x + dt * dx, y: y + dt * dy, t: t + dt };
}

// PUBLIC_INTERFACE
export function rk4Step({ x, y, t, dt }, { fx, fy }) {
  /** Runge-Kutta 4 integrator step. */
  const k1x = fx(x, y, t);
  const k1y = fy(x, y, t);

  const k2x = fx(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y, t + 0.5 * dt);
  const k2y = fy(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y, t + 0.5 * dt);

  const k3x = fx(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y, t + 0.5 * dt);
  const k3y = fy(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y, t + 0.5 * dt);

  const k4x = fx(x + dt * k3x, y + dt * k3y, t + dt);
  const k4y = fy(x + dt * k3x, y + dt * k3y, t + dt);

  const xn = x + (dt / 6) * (k1x + 2*k2x + 2*k3x + k4x);
  const yn = y + (dt / 6) * (k1y + 2*k2y + 2*k3y + k4y);
  return { x: xn, y: yn, t: t + dt };
}
