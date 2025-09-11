import React from 'react';

// PUBLIC_INTERFACE
export default function ChallengeMode({ challenges, activeId, setActiveId, onUpdateChallenges }) {
  /** Choose current challenge and manage presets. */
  const active = challenges.find(c => c.id === activeId) || challenges[0];

  const randomizeObstacles = () => {
    if (!active) return;
    const updated = challenges.map(c => {
      if (c.id !== active.id) return c;
      const obs = Array.from({ length: Math.floor(3 + Math.random() * 4) }).map(() => ({
        x: +(c.bounds?.xmin + Math.random() * ((c.bounds?.xmax ?? 5) - (c.bounds?.xmin ?? -5))).toFixed(2),
        y: +(c.bounds?.ymin + Math.random() * ((c.bounds?.ymax ?? 5) - (c.bounds?.ymin ?? -5))).toFixed(2),
      }));
      return { ...c, obstacles: obs };
    });
    onUpdateChallenges(updated);
  };

  return (
    <div>
      <div className="label">Select Challenge</div>
      <select className="select" value={activeId} onChange={(e) => setActiveId(e.target.value)}>
        {challenges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className="helper" style={{marginTop: 6}}>
        {active?.description}
      </div>
      <div className="controls-row" style={{marginTop: 8}}>
        <button className="btn secondary" onClick={randomizeObstacles}>Randomize Obstacles</button>
      </div>
    </div>
  );
}
