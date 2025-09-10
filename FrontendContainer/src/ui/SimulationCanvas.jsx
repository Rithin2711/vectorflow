import React, { useCallback, useEffect, useRef, useState } from 'react';
import { makeFieldFromEquations, eulerStep, rk4Step, detectCollision, hitTarget, clamp } from '../lib/mathUtils.js';
import { loadSettings, submitScore } from '../lib/storage.js';
import VectorFieldQuiver from './VectorFieldQuiver.jsx';

/**
 * PUBLIC_INTERFACE
 * SimulationCanvas - interactive simulation of a particle in a vector field.
 * Props:
 * - expr: {ex, ey}
 * - settings: {integrator, dt, showQuiver}
 * - selectedChallenge
 * - playerName
 */
export default function SimulationCanvas({ expr, settings, selectedChallenge, playerName }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  const [width] = useState(840);
  const [height] = useState(420);

  const [running, setRunning] = useState(true);
  const [time, setTime] = useState(0);
  const [pos, setPos] = useState({ x: 40, y: 40 });
  const [path, setPath] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [target, setTarget] = useState({ x: 780, y: 340, r: 16 });
  const [bounds, setBounds] = useState({ x: 0, y: 0, w: 840, h: 420 });
  const [radius] = useState(8);
  const [message, setMessage] = useState('');

  const fieldRef = useRef(makeFieldFromEquations(expr.ex, expr.ey));
  const integratorRef = useRef(settings.integrator);
  const dtRef = useRef(settings.dt);

  // Update settings refs
  useEffect(() => {
    integratorRef.current = settings.integrator || loadSettings().integrator;
    dtRef.current = settings.dt || loadSettings().dt;
  }, [settings.integrator, settings.dt]);

  // Update field on expression change
  useEffect(() => {
    fieldRef.current = makeFieldFromEquations(expr.ex, expr.ey);
  }, [expr.ex, expr.ey]);

  // Apply or clear challenge presets
  useEffect(() => {
    if (selectedChallenge) {
      setPos(selectedChallenge.start);
      setPath([selectedChallenge.start]);
      setObstacles(selectedChallenge.obstacles || []);
      setTarget(selectedChallenge.target);
      setBounds(selectedChallenge.bounds || { x: 0, y: 0, w: width, h: height });
      setTime(0);
      setRunning(true);
      setMessage('');
    } else {
      setObstacles([]);
      setTarget({ x: width - 60, y: height - 60, r: 16 });
      setBounds({ x: 0, y: 0, w: width, h: height });
      setMessage('');
    }
  }, [selectedChallenge, width, height]);

  // Keyboard space to pause/resume
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setRunning(r => !r);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Pointer to set new start point in free mode
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      if (!selectedChallenge) {
        setPos({ x, y });
        setPath([{ x, y }]);
        setTime(0);
        setMessage('');
      }
    };
    canvas.addEventListener('pointerdown', onDown);
    return () => canvas.removeEventListener('pointerdown', onDown);
  }, [selectedChallenge]);

  // Simulation loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const stepOnce = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (running) {
        const dtInt = dtRef.current;
        const steps = Math.max(1, Math.floor(dt / dtInt));
        let p = { ...pos };
        let t = time;
        for (let i = 0; i < steps; i++) {
          const stepFn = integratorRef.current === 'euler' ? eulerStep : rk4Step;
          const np = stepFn(p, dtInt, (x, y, tt) => fieldRef.current(x, y, tt), t);
          // keep inside bounds
          p.x = clamp(np.x, bounds.x + radius, bounds.x + bounds.w - radius);
          p.y = clamp(np.y, bounds.y + radius, bounds.y + bounds.h - radius);
          t += dtInt;

          // collision with obstacles
          if (detectCollision({ x: p.x, y: p.y, r: radius }, obstacles)) {
            setMessage('Collision! Resetting...');
            setRunning(false);
            setTimeout(() => {
              setPos(selectedChallenge?.start || { x: 40, y: 40 });
              setPath([selectedChallenge?.start || { x: 40, y: 40 }]);
              setTime(0);
              setMessage('');
              setRunning(true);
            }, 800);
            break;
          }

          // hit target
          if (hitTarget({ x: p.x, y: p.y, r: radius }, target)) {
            const newTime = t;
            setPos(p);
            setPath(prev => [...prev, { ...p }]);
            setTime(newTime);
            setRunning(false);
            setMessage('Target reached!');

            if (selectedChallenge) {
              const list = submitScore(selectedChallenge.id, playerName || 'Player', newTime);
              window.dispatchEvent(new CustomEvent('vf-event', { detail: { type: 'leaderboard-update', list } }));
            }
            break;
          }
        }
        setPos(p);
        setPath(prev => {
          const arr = [...prev, { ...p }];
          return arr.length > 1200 ? arr.slice(arr.length - 1200) : arr;
        });
        setTime(t);

        // Emit speed metric for plot
        const v = fieldRef.current(p.x, p.y, t);
        const speed = Math.hypot(v.fx, v.fy);
        window.dispatchEvent(new CustomEvent('vf-event', { detail: { type: 'sim-metric', value: speed } }));
      }

      draw();
      raf = requestAnimationFrame(stepOnce);
    };

    const draw = () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);

      // background grid
      ctx.fillStyle = '#0a0d12';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.strokeStyle = '#11161c';
      ctx.lineWidth = 1;
      for (let x = bounds.x; x <= bounds.w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, bounds.y);
        ctx.lineTo(x, bounds.y + bounds.h);
        ctx.stroke();
      }
      for (let y = bounds.y; y <= bounds.h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(bounds.x, y);
        ctx.lineTo(bounds.x + bounds.w, y);
        ctx.stroke();
      }

      // obstacles
      ctx.fillStyle = '#f85149';
      obstacles.forEach(o => {
        ctx.globalAlpha = 0.25;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '#8c3131';
        ctx.strokeRect(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1);
      });

      // path
      if (path.length > 1) {
        ctx.strokeStyle = '#58a6ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
      }

      // target
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
      ctx.strokeStyle = '#3fb950';
      ctx.lineWidth = 2;
      ctx.stroke();

      // player
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd166';
      ctx.fill();

      // overlay info
      if (overlayRef.current) {
        overlayRef.current.innerText = `t=${time.toFixed(2)}s  pos=(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})  ${running ? '▶' : '⏸'}  ${message}`;
      }
    };

    raf = requestAnimationFrame(stepOnce);
    return () => cancelAnimationFrame(raf);
  }, [running, bounds, obstacles, target, radius, time, pos, path, selectedChallenge, playerName]);

  const toggleRun = useCallback(() => setRunning(r => !r), []);
  const reset = useCallback(() => {
    const start = selectedChallenge?.start || { x: 40, y: 40 };
    setPos(start);
    setPath([start]);
    setTime(0);
    setMessage('');
    setRunning(false);
  }, [selectedChallenge]);

  return (
    <>
      <div className="sim-toolbar">
        <div className="button-row">
          <button className="primary" onClick={toggleRun}>{running ? 'Pause' : 'Run'}</button>
          <button onClick={reset}>Reset</button>
        </div>
        <div className="small" style={{marginLeft:8}}>Integrator: {settings.integrator.toUpperCase()} • dt={settings.dt}</div>
        {selectedChallenge && (
          <div className="small" style={{marginLeft:16, color:'#ffa657'}}>
            Time limit: {selectedChallenge.timeLimit}s
          </div>
        )}
      </div>
      <div className="sim-area" style={{ height: 420 }}>
        <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div className="sim-overlay" ref={overlayRef} />
        <div style={{ position: 'absolute', right: 8, top: 8, pointerEvents: 'none' }}>
          <VectorFieldQuiver
            width={width}
            height={height}
            field={(x, y, t) => fieldRef.current(x, y, t)}
            t={time}
            show={settings.showQuiver}
          />
        </div>
      </div>
    </>
  );
}
