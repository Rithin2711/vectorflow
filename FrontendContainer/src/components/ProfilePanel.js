import React, { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createDefaultProfile } from '../utils/profile';

// PUBLIC_INTERFACE
export default function ProfilePanel({ player, setPlayer }) {
  /** Manage player profile locally (nickname, id, avatar seed) and show basic stats. */
  const avatar = useMemo(() => `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(player.avatarSeed || player.name || 'U')}`, [player]);

  const regenerateId = () => {
    setPlayer(p => ({ ...p, id: uuidv4() }));
  };

  const randomizeAvatar = () => {
    const seed = Math.random().toString(36).slice(2, 10);
    setPlayer(p => ({ ...p, avatarSeed: seed }));
  };

  const resetProfile = () => {
    setPlayer(createDefaultProfile());
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <img src={avatar} width={48} height={48} alt="avatar" style={{ borderRadius: 8, border: '1px solid var(--border-color)' }} />
        <div>
          <div className="label">Nickname</div>
          <input className="input" value={player.name} onChange={(e) => setPlayer(p => ({ ...p, name: e.target.value }))} />
        </div>
      </div>
      <div className="helper" style={{ marginTop: 6 }}>ID: {player.id}</div>
      <div className="controls-row" style={{ marginTop: 6 }}>
        <button className="btn secondary" onClick={randomizeAvatar}>New Avatar</button>
        <button className="btn secondary" onClick={regenerateId}>New ID</button>
        <button className="btn danger" onClick={resetProfile}>Reset</button>
      </div>
      <hr className="soft" />
      <div className="metrics">
        <div className="metric">
          <div className="k">Games</div>
          <div className="v">{player.stats.games}</div>
        </div>
        <div className="metric">
          <div className="k">Best</div>
          <div className="v">{player.stats.bestScore}</div>
        </div>
        <div className="metric">
          <div className="k">Total</div>
          <div className="v">{player.stats.totalScore}</div>
        </div>
      </div>
    </div>
  );
}
