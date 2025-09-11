 // PUBLIC_INTERFACE
export function integrateEuler(state, deriv, dt) {
  /** Simple Euler integrator for 2D state {x, y}. */
  const v = deriv(state, 0);
  return { x: state.x + v.fx * dt, y: state.y + v.fy * dt };
}

// PUBLIC_INTERFACE
export function integrateRK4(state, deriv, dt) {
  /** Classical RK4 integrator for 2D state {x, y}. */
  const k1 = deriv(state, 0);
  const k2 = deriv({ x: state.x + 0.5 * dt * k1.fx, y: state.y + 0.5 * dt * k1.fy }, 0.5 * dt);
  const k3 = deriv({ x: state.x + 0.5 * dt * k2.fx, y: state.y + 0.5 * dt * k2.fy }, 0.5 * dt);
  const k4 = deriv({ x: state.x + dt * k3.fx, y: state.y + dt * k3.fy }, dt);
  const fx = (k1.fx + 2 * k2.fx + 2 * k3.fx + k4.fx) / 6;
  const fy = (k1.fy + 2 * k2.fy + 2 * k3.fy + k4.fy) / 6;
  return { x: state.x + fx * dt, y: state.y + fy * dt };
}
