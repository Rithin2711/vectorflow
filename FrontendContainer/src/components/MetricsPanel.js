import React, { useEffect, useRef } from 'react';

// PUBLIC_INTERFACE
export default function MetricsPanel({ t, position, trajectory, collisions, score }) {
  /** Display numeric metrics and a small trend plot of speed over time. */
  const plotRef = useRef(null);

  useEffect(() => {
    // Guard: if no DOM node or running in non-DOM environment, skip plotting
    if (typeof window === 'undefined' || !plotRef.current) return;

    const times = trajectory.map(p => p.t);
    const speeds = trajectory.map((p, i) => {
      if (i === 0) return 0;
      const dx = p.x - trajectory[i - 1].x;
      const dy = p.y - trajectory[i - 1].y;
      return Math.hypot(dx, dy) / Math.max(1e-9, p.t - trajectory[i - 1].t);
    });

    const layout = {
      margin: { l: 24, r: 8, t: 10, b: 18 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      xaxis: { color: 'var(--text-secondary)', gridcolor: 'rgba(255,255,255,0.08)' },
      yaxis: { color: 'var(--text-secondary)', gridcolor: 'rgba(255,255,255,0.08)' },
      height: 160
    };

    const data = [{
      x: times, y: speeds, type: 'scatter', mode: 'lines',
      line: { color: '#9ab3ff', width: 2 }
    }];

    let plotly;
    let mounted = true;

    (async () => {
      try {
        // Dynamically import Plotly only in the browser
        plotly = (await import('plotly.js-dist-min')).default;
        if (!mounted) return;
        await plotly.newPlot(plotRef.current, data, layout, { displayModeBar: false, responsive: true });
      } catch {
        // ignore plotting errors in headless environments
      }
    })();

    return () => {
      mounted = false;
      try {
        if (plotly && plotRef.current) plotly.purge(plotRef.current);
      } catch {
        // ignore
      }
    };
  }, [trajectory]);

  return (
    <div>
      <div className="metrics">
        <div className="metric">
          <div className="k">Time</div>
          <div className="v">{t.toFixed(2)} s</div>
        </div>
        <div className="metric">
          <div className="k">Position</div>
          <div className="v">({position.x.toFixed(2)}, {position.y.toFixed(2)})</div>
        </div>
        <div className="metric">
          <div className="k">Collisions</div>
          <div className="v">{collisions}</div>
        </div>
      </div>
      <div className="metric" style={{ marginTop: 8 }}>
        <div className="k">Score</div>
        <div className="v">{score}</div>
      </div>
      <div ref={plotRef} style={{ width: '100%', marginTop: 8 }} />
    </div>
  );
}
