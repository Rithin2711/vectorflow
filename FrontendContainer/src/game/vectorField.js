 // PUBLIC_INTERFACE
export function evalVectorField(parsed, x, y, t) {
  /**
   * Evaluates the parsed vector field at (x, y, t).
   * parsed: { fx: (scope) => number, fy: (scope) => number }
   */
  try {
    const scope = { x, y, t };
    return { fx: parsed.fx(scope), fy: parsed.fy(scope) };
  } catch (e) {
    return { fx: 0, fy: 0 };
  }
}
