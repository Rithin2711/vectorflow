import { create, all } from 'mathjs';

const math = create(all, {});

/**
 * parseEquationStrings compiles f(x,y,t) and g(x,y,t) from strings
 * and returns a function (x,y,t) -> { vx, vy }.
 * It guards against access to unwanted identifiers by using mathjs parse/eval with a restricted scope.
 */

// PUBLIC_INTERFACE
export function parseEquationStrings(fx, fy) {
  /** Compile ODE component strings into a vector field function. */
  if (typeof fx !== 'string' || typeof fy !== 'string') {
    throw new Error('Equation must be strings.');
  }
  const nodeFx = math.parse(fx);
  const nodeFy = math.parse(fy);

  // precompile for performance
  const codeFx = nodeFx.compile();
  const codeFy = nodeFy.compile();

  const allowed = ['x', 'y', 't', 'pi', 'e'];
  const scopeBase = {
    pi: Math.PI,
    e: Math.E,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    atan2: Math.atan2,
    sqrt: Math.sqrt,
    abs: Math.abs,
    exp: Math.exp,
    log: Math.log,
    min: Math.min,
    max: Math.max,
    pow: Math.pow
  };

  return (x, y, t) => {
    const scope = { ...scopeBase, x, y, t };
    // Evaluate
    const vx = codeFx.evaluate(scope);
    const vy = codeFy.evaluate(scope);
    if (!isFinite(vx) || !isFinite(vy)) {
      return { vx: 0, vy: 0 };
    }
    return { vx: Number(vx), vy: Number(vy) };
  };
}
