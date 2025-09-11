import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseEquationStrings } from '../utils/equationParser';
import { distance, clamp } from '../utils/math';
import { logEvent } from '../services/logging';

/**
 * useSimulation runs a 2D ODE simulation for position (x,y):
 *   dx/dt = f(x,y,t), dy/dt = g(x,y,t)
 * It supports:
 * - adaptive dt control (user-controlled)
 * - collisions with circular obstacles
 * - simple bounce on bounds
 * - scoring: decrease over time and with collisions; reward reaching target
 */

// PUBLIC_INTERFACE
export default function useSimulation({ odeStrings, bounds, challenge }) {
  /** Public hook for FlowQuest simulation and state. */
  const [dt, setDt] = useState(0.02);
  const [isRunning, setIsRunning] = useState(false);
  const [t, setT] = useState(0);
  const [position, setPosition] = useState(challenge?.start || { x: 0, y: 0 });
  const [trajectory, setTrajectory] = useState([{ ...position, t: 0 }]);
  const [collisions, setCollisions] = useState(0);
  const [obstacles, setObstacles] = useState(challenge?.obstacles || []);
  const [target, setTarget] = useState(challenge?.target || null);
  const [score, setScore] = useState(0);

  const [error, setError] = useState('');
  const fieldRef = useRef(() => ({ vx: 0, vy: 0 }));

  // set field from strings
  const setFieldFromStrings = useCallback((fx, fy) => {
    try {
      const fn = parseEquationStrings(fx, fy);
      fieldRef.current = fn;
      setError('');
    } catch (e) {
      setError(e.message || 'Invalid equation.');
    }
  }, []);

  // initialize field
  useEffect(() => {
    setFieldFromStrings(odeStrings?.fx || 'y', odeStrings?.fy || '-x');
  }, [odeStrings, setFieldFromStrings]);

  // recompute when challenge changes
  useEffect(() => {
    if (!challenge) return;
    setPosition(challenge.start);
    setTrajectory([{ ...challenge.start, t: 0 }]);
    setT(0);
    setCollisions(0);
    setObstacles(challenge.obstacles || []);
    setTarget(challenge.target || null);
    setScore(0);
  }, [challenge]);

  const fieldFn = useCallback((x, y, tt) => {
    try {
      return fieldRef.current(x, y, tt);
    } catch {
      return { vx: 0, vy: 0 };
    }
  }, []);

  const stepRK4 = useCallback((pos, time, h) => {
    // 4th order Runge-Kutta for better stability
    const f = (x, y, t0) => fieldFn(x, y, t0);
    const k1 = f(pos.x, pos.y, time);

    const k2 = f(pos.x + 0.5 * h * k1.vx, pos.y + 0.5 * h * k1.vy, time + 0.5 * h);
    const k3 = f(pos.x + 0.5 * h * k2.vx, pos.y + 0.5 * h * k2.vy, time + 0.5 * h);
    const k4 = f(pos.x + h * k3.vx, pos.y + h * k3.vy, time + h);

    const dx = (h / 6) * (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx);
    const dy = (h / 6) * (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy);

    return { x: pos.x + dx, y: pos.y + dy };
  }, [fieldFn]);

  // Simulation loop via setInterval, tied to isRunning
  const intervalRef = useRef(null);
  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setT(prev => prev + dt);
      setPosition(prev => {
        const next = stepRK4(prev, t, dt);

        // bounds bounce
        const b = bounds;
        let nx = next.x;
        let ny = next.y;
        let bounced = false;
        if (nx < b.xmin) { nx = b.xmin + (b.xmin - nx); bounced = true; }
        if (nx > b.xmax) { nx = b.xmax - (nx - b.xmax); bounced = true; }
        if (ny < b.ymin) { ny = b.ymin + (b.ymin - ny); bounced = true; }
        if (ny > b.ymax) { ny = b.ymax - (ny - b.ymax); bounced = true; }

        // collision with obstacles (simple circle radius 0.35)
        let collided = false;
        for (const obs of obstacles) {
          if (distance({ x: nx, y: ny }, obs) < 0.35) {
            collided = true; break;
          }
        }

        if (bounced || collided) {
          setCollisions(c => c + 1);
          setScore(s => Math.max(0, s - 25));
          logEvent('collision', { bounced, collided, pos: { x: nx, y: ny } });
        }

        const res = { x: nx, y: ny };
        setTrajectory(tr => {
          const arr = tr.length > 2000 ? tr.slice(tr.length - 2000) : tr;
          return [...arr, { ...res, t: t + dt }];
        });
        // scoring over time
        setScore(s => Math.max(0, s + 1));

        return res;
      });
    }, Math.max(10, dt * 1000)); // scale to real-time-ish
    return () => clearInterval(intervalRef.current);
  }, [isRunning, dt, bounds, stepRK4, obstacles, t]);

  // PUBLIC_INTERFACE
  const start = useCallback(() => { setIsRunning(true); logEvent('sim_start', {}); }, []);
  // PUBLIC_INTERFACE
  const pause = useCallback(() => { setIsRunning(false); logEvent('sim_pause', {}); }, []);
  // PUBLIC_INTERFACE
  const reset = useCallback(() => {
    setIsRunning(false);
    const startPos = challenge?.start || { x: 0, y: 0 };
    setPosition(startPos);
    setTrajectory([{ ...startPos, t: 0 }]);
    setT(0);
    setCollisions(0);
    setScore(0);
    logEvent('sim_reset', {});
  }, [challenge]);
  // PUBLIC_INTERFACE
  const step = useCallback(() => {
    if (isRunning) return;
    setT(prev => prev + dt);
    setPosition(prev => {
      const next = stepRK4(prev, t, dt);
      setTrajectory(tr => [...tr, { ...next, t: t + dt }]);
      return next;
    });
    logEvent('sim_step', { dt });
  }, [isRunning, dt, stepRK4, t]);

  return {
    start, pause, reset, step,
    isRunning, t, position, trajectory, setPosition,
    fieldFn, error, setFieldFromStrings, setDt, dt,
    collisions, setObstacles, obstacles, target, setTarget, score, setScore
  };
}
