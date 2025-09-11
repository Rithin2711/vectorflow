import { create } from 'zustand';
import { saveLocalLeaderboard } from '../utils/localStorage';
import { v4 as uuidv4 } from 'uuid';

const defaultExpr = { fx: '-y', fy: 'x' };

// PUBLIC_INTERFACE
const useGameStore = create((set, get) => ({
  // Simulation state
  playing: false,
  speed: 1.0,
  timeElapsed: 0,
  collisions: 0,
  score: 0,
  startPos: { x: 200, y: 150 },
  goalPos: { x: 600, y: 300 },
  bounds: { xMin: 0, xMax: 2000, yMin: 0, yMax: 2000 },

  // Vector field expressions and parsed
  fieldExpr: defaultExpr,
  parsedField: null,

  // Modes
  challengeMode: false,

  // Phaser game instance
  phaserGame: null,

  // PUBLIC_INTERFACE
  setPlaying: (playing) => set({ playing }),
  // PUBLIC_INTERFACE
  setSpeed: (speed) => set({ speed }),
  // PUBLIC_INTERFACE
  tickTime: (dt) => set({ timeElapsed: get().timeElapsed + dt }),
  // PUBLIC_INTERFACE
  resetSimulation: () => set({ timeElapsed: 0, collisions: 0, score: 0 }),
  // PUBLIC_INTERFACE
  setStartPos: (pos) => set({ startPos: pos }),
  // PUBLIC_INTERFACE
  setGoalPos: (pos) => set({ goalPos: pos }),
  // PUBLIC_INTERFACE
  setFieldExpr: (expr) => set({ fieldExpr: expr }),
  // PUBLIC_INTERFACE
  setParsedField: (parsed) => set({ parsedField: parsed }),
  // PUBLIC_INTERFACE
  setChallengeMode: (on) => set({ challengeMode: on }),
  // PUBLIC_INTERFACE
  setPhaserGame: (game) => set({ phaserGame: game }),

  // PUBLIC_INTERFACE
  onCollision: () => {
    const c = get().collisions + 1;
    const score = Math.max(0, get().score - 5);
    set({ collisions: c, score });
  },

  // PUBLIC_INTERFACE
  onGoalReached: () => {
    // scoring: reward inversely with time and collisions
    const time = get().timeElapsed;
    const collisions = get().collisions;
    const add = Math.max(10, Math.round(100 / (1 + time * 0.2 + collisions * 0.5)));
    set({ score: get().score + add });
    // Save a snapshot to local leaderboard
    const entry = {
      id: uuidv4(),
      name: 'Player',
      score: get().score + add,
      time: time,
      date: Date.now()
    };
    saveLocalLeaderboard(entry);
  }
}));

export default useGameStore;
