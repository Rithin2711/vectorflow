import React, { useMemo, useState } from 'react';
import EquationInput from './EquationInput.jsx';
import SimulationCanvas from './SimulationCanvas.jsx';
import PlotPanel from './PlotPanel.jsx';
import ChallengePanel from './ChallengePanel.jsx';
import LeaderboardPanel from './LeaderboardPanel.jsx';
import { defaultChallenges } from '../lib/mathUtils.js';
import { loadProfile, saveProfile, loadSettings, saveSettings } from '../lib/storage.js';

// PUBLIC_INTERFACE
export default function App() {
  /** Root app with layout. */
  const [profile, setProfile] = useState(loadProfile());
  const [settings, setSettings] = useState(loadSettings());
  const [expr, setExpr] = useState({ ex: '1', ey: '0' });

  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const challenges = useMemo(() => defaultChallenges(), []);

  const onProfileChange = (field, value) => {
    const p = { ...profile, [field]: value };
    setProfile(p);
    saveProfile(p);
  };

  const onSettingsChange = (s) => {
    setSettings(s);
    saveSettings(s);
  };

  return (
    <div className="app">
      <div className="header">
        <h1>VectorFlow: FlowQuest</h1>
        <span className="small">Interactive Vector Fields • ODE Simulation • Challenges</span>
        <div className="spacer" />
        <div className="small">Tip: Press <kbd>Space</kbd> to pause/resume</div>
      </div>

      <div className="left-panel">
        <div className="section">
          <h3>Player</h3>
          <div className="input-row">
            <input
              value={profile.name}
              onChange={(e) => onProfileChange('name', e.target.value)}
              placeholder="Display name"
            />
          </div>
        </div>

        <div className="section">
          <h3>Equation</h3>
          <EquationInput value={expr} onChange={setExpr} />
          <p className="small">dx/dt = f(x,y,t), dy/dt = g(x,y,t). Use Math functions, variables x, y, t.</p>
        </div>

        <div className="section">
          <h3>Simulation Settings</h3>
          <div className="input-row">
            <select
              value={settings.integrator}
              onChange={(e) => onSettingsChange({ ...settings, integrator: e.target.value })}
            >
              <option value="euler">Euler</option>
              <option value="rk4">RK4</option>
            </select>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={settings.dt}
              onChange={(e) => onSettingsChange({ ...settings, dt: parseFloat(e.target.value || '0.01') })}
              title="Time step"
            />
          </div>
          <div className="input-row">
            <label style={{display:'flex', alignItems:'center', gap:8}}>
              <input
                type="checkbox"
                checked={settings.showQuiver}
                onChange={(e) => onSettingsChange({ ...settings, showQuiver: e.target.checked })}
              />
              Show vector field
            </label>
          </div>
        </div>

        <div className="section">
          <h3>Challenges</h3>
          <div className="list">
            {challenges.map(ch => (
              <div key={ch.id} className="row">
                <div>
                  <div className="title">{ch.name}</div>
                  <div className="meta">{ch.description}</div>
                </div>
                <div>
                  <button className="primary" onClick={() => setSelectedChallenge(ch)}>Select</button>
                </div>
              </div>
            ))}
          </div>
          <hr className="sep" />
          <button className="warn" onClick={() => setSelectedChallenge(null)}>Free Mode</button>
        </div>
      </div>

      <div className="center-panel">
        <div className="canvas-wrap">
          <SimulationCanvas
            expr={expr}
            settings={settings}
            selectedChallenge={selectedChallenge}
            playerName={profile.name}
          />
          <div className="plot-area">
            <PlotPanel />
          </div>
        </div>
      </div>

      <div className="right-panel">
        <ChallengePanel selectedChallenge={selectedChallenge} />
        <hr className="sep" />
        <LeaderboardPanel selectedChallenge={selectedChallenge} />
      </div>

      <div className="footer">
        <div className="small">
          © FlowQuest — Learn vector fields by playing. No backend required. Data stored locally.
        </div>
        <div className="small">
          Integrators: Euler, RK4 • Visualization: Canvas + D3 Quiver • Charts: Plotly-ready
        </div>
      </div>
    </div>
  );
}
