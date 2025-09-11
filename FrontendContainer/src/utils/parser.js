import { create, all } from 'mathjs';

const math = create(all, {
  // Security-conscious: disable potentially unsafe functions if needed
  matrix: 'Array'
});

// PUBLIC_INTERFACE
export function parseVectorField(expr) {
  /**
   * Parses string expressions for Fx and Fy into compiled evaluators.
   * expr: { fx: string, fy: string }
   * returns: { fx: (scope) => number, fy: (scope) => number }
   */
  if (!expr || typeof expr.fx !== 'string' || typeof expr.fy !== 'string') {
    throw new Error('Invalid expressions');
  }
  try {
    const fxNode = math.parse(expr.fx);
    const fyNode = math.parse(expr.fy);
    const fxEval = fxNode.compile();
    const fyEval = fyNode.compile();
    return {
      fx: (scope) => Number(fxEval.evaluate(scope)),
      fy: (scope) => Number(fyEval.evaluate(scope))
    };
  } catch (e) {
    throw new Error('Failed to parse expressions: ' + e.message);
  }
}
