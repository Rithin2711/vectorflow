import React, { useMemo, useState, useEffect, useCallback } from 'react';
import './App.css';

import EquationInput from './components/EquationInput';
import VectorFieldCanvas from './components/VectorFieldCanvas';
import SimulationControls from './components/SimulationControls';
import MetricsPanel from './components/MetricsPanel';
import ChallengeMode from './components/ChallengeMode';
import Leaderboard from './components/Leaderboard';
import ProfilePanel from './components/ProfilePanel';

import useLocalStorage from './hooks/useLocalStorage';
import useSimulation from './hooks/useSimulation';

import { logEvent } from './services/logging';
import { defaultChallenges } from './utils/challenges';
import { createDefaultProfile } from './utils/profile';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useLocalStorage('fq_theme', 'dark');
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [setTheme]);

  // Game and simulation state
  const [ode, setOde] = useLocalStorage('fq_ode', { fx: 'y', fy: '-x' });
  const [bounds, setBounds] = useLocalStorage('fq_bounds', { xmin: -5, xmax: 5, ymin: -5, ymax: 5 });
  const [player, setPlayer] = useLocalStorage('fq_player', createDefaultProfile());
  const [challenges, setChallenges] = useLocalStorage('fq_challenges', defaultChallenges);
  const [activeChallengeId, setActiveChallengeId] = useLocalStorage('fq_activeChallenge', defaultChallenges[0].id);

  // Draw mode state (new): user draws a path and ball follows that path
  const [drawMode, setDrawMode] = useLocalStorage('fq_draw_mode', true);
  const [drawnPath, setDrawnPath] = useState([]); // world-coordinates points
  const [isAnimatingPath, setIsAnimatingPath] = useState(false);

  const activeChallenge = useMemo(
    () => challenges.find(c => c.id === activeChallengeId) || challenges[0],
    [challenges, activeChallengeId]
  );

  const {
    start, pause, reset, step,
    isRunning, t, position, trajectory, setPosition,
    fieldFn, error, setFieldFromStrings, setDt, dt,
    collisions, setObstacles, obstacles, target, setTarget, score, setScore
  } = useSimulation({
    odeStrings: ode,
    bounds,
    challenge: activeChallenge
  });

  // Initialize from active challenge
  useEffect(() => {
    if (!activeChallenge) return;
    setTarget(activeChallenge.target);
    setObstacles(activeChallenge.obstacles);
    setPosition(activeChallenge.start);
    setScore(0);
    setDrawnPath([]);
    setIsAnimatingPath(false);
    logEvent('challenge_selected', { id: activeChallenge.id, name: activeChallenge.name });
  }, [activeChallenge, setTarget, setObstacles, setPosition, setScore]);

  // When user edits ODE (kept for Equation mode)
  const onApplyEquation = (fx, fy) => {
    setOde({ fx, fy });
    setFieldFromStrings(fx, fy);
    logEvent('ode_updated', { fx, fy });
  };

  const onCanvasClick = (x, y) => {
    // move particle to clicked spot while paused and not animating
    if (isAnimatingPath) return;
    setPosition({ x, y });
    logEvent('canvas_click_move', { x, y });
  };

  const onReachTarget = useCallback((finalScore) => {
    const updated = { ...player };
    updated.stats.games += 1;
    updated.stats.bestScore = Math.max(updated.stats.bestScore, finalScore);
    updated.stats.totalScore += finalScore;
    setPlayer(updated);
    logEvent('target_reached', { finalScore, challenge: activeChallenge?.id });
  }, [player, setPlayer, activeChallenge]);

  // PUBLIC_INTERFACE
  const exportState = () => {
    const data = {
      ode, bounds, player, challenges, activeChallengeId, drawMode
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'flowquest-state.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // PUBLIC_INTERFACE
  const startPathAnimation = useCallback(() => {
    if (!drawnPath.length) return;
    // Ensure first point starts from current position: prepend if needed
    const first = drawnPath[0];
    if (!first || Math.hypot(first.x - position.x, first.y - position.y) > 1e-6) {
      setDrawnPath(path => [{ x: position.x, y: position.y }, ...path]);
    }
    setIsAnimatingPath(true);
    logEvent('path_animation_start', { points: drawnPath.length });
  }, [drawnPath, position]);

  // PUBLIC_INTERFACE
  const clearPath = useCallback(() => {
    setDrawnPath([]);
    setIsAnimatingPath(false);
    logEvent('path_clear', {});
  }, []);

  // While animating, step along the drawn path at a constant speed
  useEffect(() => {
    if (!isAnimatingPath) return;
    if (drawnPath.length < 2) { setIsAnimatingPath(false); return; }

    let idx = 0; // segment index
    let segT = 0; // 0..1 along segment
    const speed = 2.0; // world units per second
    let lastTs = performance.now();
    let cancelled = false;

    const stepAnim = (now) => {
      if (cancelled || !isAnimatingPath) return;
      const dtSec = Math.max(0, (now - lastTs) / 1000);
      lastTs = now;

      const a = drawnPath[idx];
      const b = drawnPath[idx + 1];
      const segLen = Math.hypot(b.x - a.x, b.y - a.y) || 1e-8;
      const adv = (speed * dtSec) / segLen;
      segT += adv;

      while (segT >= 1 && idx < drawnPath.length - 2) {
        segT -= 1;
        idx += 1;
      }

      const curA = drawnPath[idx];
      const curB = drawnPath[idx + 1] || curA;
      const tLerp = Math.min(1, Math.max(0, segT));
      const nx = curA.x + (curB.x - curA.x) * tLerp;
      const ny = curA.y + (curB.y - curA.y) * tLerp;

      setPosition({ x: nx, y: ny });

      // Simple reach check: stop when close to target
      if (target && Math.hypot(nx - target.x, ny - target.y) < 0.3) {
        setIsAnimatingPath(false);
        onReachTarget(Math.max(0, Math.floor(1000 - drawnPath.length)));
        return;
      }

      // Stop if path finished
      if (idx >= drawnPath.length - 2 && segT >= 1) {
        setIsAnimatingPath(false);
        return;
      }

      requestAnimationFrame(stepAnim);
    };

    const id = requestAnimationFrame(stepAnim);
    return () => { cancelled = true; cancelAnimationFrame(id); };
  }, [isAnimatingPath, drawnPath, setPosition, target, onReachTarget]);

  return (
    <div className="app-shell">
      <div className="navbar">
        <div className="brand">
          <span style={{fontSize: 20}}>🌀 FlowQuest</span>
          <span className="badge">Vector Fields • ODE • Learning</span>
        </div>
        <div className="controls-row">
          <button className="btn secondary" onClick={exportState} title="Export local state">Export</button>
          <button className="btn secondary" onClick={() => setDrawMode(dm => !dm)} title="Toggle Mode">
            {drawMode ? '✏️ Draw Mode' : '∑ Equation Mode'}
          </button>
          <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </div>

      <div className="left-panel">
        <div className="panel">
          <div className="section-title">Simulation</div>
          <SimulationControls
            isRunning={isRunning}
            onStart={start}
            onPause={pause}
            onReset={() => { reset(); clearPath(); }}
            onStep={step}
            dt={dt}
            setDt={setDt}
            bounds={bounds}
            setBounds={setBounds}
          />
        </div>

        <div className="panel">
          <div className="section-title">Metrics</div>
          <MetricsPanel
            t={t}
            position={position}
            trajectory={trajectory}
            collisions={collisions}
            score={score}
          />
        </div>
      </div>

      <div className="main-panel">
        <div className="panel">
          <div className="section-title">Challenge</div>
          <ChallengeMode
            challenges={challenges}
            activeId={activeChallengeId}
            setActiveId={setActiveChallengeId}
            onUpdateChallenges={setChallenges}
          />
        </div>
        <div className="canvas-wrap panel graph-paper" style={{padding: 0}}>
          <div className="canvas-toolbar">
            <button className="btn" onClick={() => setTarget(position)}>Set Target Here</button>
            <button className="btn secondary" onClick={() => setObstacles([])}>Clear Obstacles</button>
            {drawMode && (
              <>
                <button className="btn success" onClick={startPathAnimation} disabled={isAnimatingPath || drawnPath.length < 2}>
                  ▶ Animate Path
                </button>
                <button className="btn secondary" onClick={clearPath} disabled={isAnimatingPath}>
                  Clear Path
                </button>
              </>
            )}
          </div>
          <VectorFieldCanvas
            bounds={bounds}
            fieldFn={fieldFn}
            position={position}
            target={target}
            obstacles={obstacles}
            trajectory={trajectory}
            isRunning={isRunning}
            onCanvasClick={onCanvasClick}
            onReachTarget={onReachTarget}
            // new draw mode props
            drawMode={drawMode}
            drawnPath={drawnPath}
            setDrawnPath={setDrawnPath}
            isAnimatingPath={isAnimatingPath}
          />
        </div>

        {/* Hide Equation input panel when draw mode is active */}
        {!drawMode && (
          <div className="panel" style={{ marginTop: 0 }}>
            <div className="section-title">Equation</div>
            <EquationInput
              initialFx={ode.fx}
              initialFy={ode.fy}
              onApply={onApplyEquation}
              error={error}
            />
            <div className="helper">Enter component functions f(x,y), g(x,y) to define dx/dt and dy/dt.</div>
          </div>
        )}
      </div>

      <div className="right-panel">
        <div className="panel">
          <div className="section-title">Profile</div>
          <ProfilePanel player={player} setPlayer={setPlayer} />
        </div>
        <div className="panel">
          <div className="section-title">Leaderboard</div>
          <Leaderboard />
        </div>
        <div className="panel">
          <div className="section-title">Help</div>
          <div className="helper">
            {drawMode ? (
              <>
                • Press and drag on the graph paper to draw a path from the ball to the target.<br/>
                • Click "Animate Path" to let the ball follow the path you drew.<br/>
                • Clear the path to draw again.
              </>
            ) : (
              <>
                • Click the canvas to move the particle when paused.<br/>
                • Edit f and g to change the vector field.<br/>
                • Reach the target while avoiding obstacles.<br/>
                • Use smaller dt for accuracy, larger for speed.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
