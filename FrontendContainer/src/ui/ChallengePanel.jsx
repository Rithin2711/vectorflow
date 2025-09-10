import React from 'react';

/**
 * PUBLIC_INTERFACE
 * ChallengePanel - shows selected challenge details.
 */
export default function ChallengePanel({ selectedChallenge }) {
  if (!selectedChallenge) {
    return (
      <div>
        <h3>Challenge Mode</h3>
        <p className="small">Select a challenge from the left panel to begin. In Free Mode, you can explore any equations and fields.</p>
      </div>
    );
  }
  const c = selectedChallenge;
  return (
    <div>
      <h3>Challenge: {c.name}</h3>
      <p className="small">{c.description}</p>
      <div className="list">
        <div className="row">
          <div className="title">Time Limit</div>
          <div className="meta">{c.timeLimit}s</div>
        </div>
        <div className="row">
          <div className="title">Start</div>
          <div className="meta">({c.start.x}, {c.start.y})</div>
        </div>
        <div className="row">
          <div className="title">Target</div>
          <div className="meta">({c.target.x}, {c.target.y}), r={c.target.r}</div>
        </div>
        <div className="row">
          <div className="title">Obstacles</div>
          <div className="meta">{c.obstacles.length}</div>
        </div>
      </div>
    </div>
  );
}
