import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { parseEquationSet } from '../utils/equations';
import { saveLocal, loadLocal } from '../utils/storage';

const DEFAULT_EQUATIONS = {
  x: 'dx/dt = y',
  y: 'dy/dt = -x',
};

const PERSIST_KEY = 'flowquest-store-v1';

const initial = loadLocal(PERSIST_KEY, {
  player: { id: uuidv4(), name: 'Player' },
  equations: DEFAULT_EQUATIONS,
  bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
  dt: 0.02,
  speed: 1,
  difficulty: 'normal',
  obstacles: [],
  leaderboard: [],
  samples: 20,
});

export const useGameStore = create((set, get) => ({
  ...initial,
  // PUBLIC_INTERFACE
  setPlayerName: (name) => {
    set((s) => ({ player: { ...s.player, name } }));
    saveLocal(PERSIST_KEY, get());
  },
  // PUBLIC_INTERFACE
  setEquations: (eq) => {
    set({ equations: eq });
    saveLocal(PERSIST_KEY, get());
  },
  // PUBLIC_INTERFACE
  setBounds: (b) => { set({ bounds: b }); saveLocal(PERSIST_KEY, get()); },
  // PUBLIC_INTERFACE
  setDt: (dt) => { set({ dt }); saveLocal(PERSIST_KEY, get()); },
  // PUBLIC_INTERFACE
  setSpeed: (speed) => { set({ speed }); saveLocal(PERSIST_KEY, get()); },
  // PUBLIC_INTERFACE
  setDifficulty: (d) => { set({ difficulty: d }); saveLocal(PERSIST_KEY, get()); },
  // PUBLIC_INTERFACE
  setSamples: (n) => { set({ samples: n }); saveLocal(PERSIST_KEY, get()); },
  // PUBLIC_INTERFACE
  addLeaderboard: (entry) => {
    const lb = [...get().leaderboard, entry].sort((a,b)=>b.score-a.score).slice(0, 25);
    set({ leaderboard: lb });
    saveLocal(PERSIST_KEY, get());
  },
  // PUBLIC_INTERFACE
  resetLeaderboard: () => { set({ leaderboard: [] }); saveLocal(PERSIST_KEY, get()); },

  // Derived helper to compile equations
  // PUBLIC_INTERFACE
  compileEquations: () => parseEquationSet(get().equations),
}));
