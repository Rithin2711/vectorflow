import { v4 as uuidv4 } from 'uuid';

// PUBLIC_INTERFACE
export const defaultChallenges = [
  {
    id: uuidv4(),
    name: 'Intro: Circular Flow',
    description: 'Default rotational field dx/dt = y, dy/dt = -x. Reach the green target.',
    start: { x: 1.5, y: 0 },
    target: { x: -1.5, y: 0 },
    obstacles: [{ x: 0, y: 0.5 }, { x: 0.6, y: -0.8 }],
    bounds: { xmin: -5, xmax: 5, ymin: -5, ymax: 5 }
  },
  {
    id: uuidv4(),
    name: 'Saddle Escape',
    description: 'Saddle-like dynamics. Avoid the center traps.',
    start: { x: -2.0, y: -1.0 },
    target: { x: 2.5, y: 1.5 },
    obstacles: [{ x: 0, y: 0 }, { x: -0.5, y: 0.5 }, { x: 0.8, y: -0.6 }],
    bounds: { xmin: -6, xmax: 6, ymin: -4, ymax: 4 }
  },
  {
    id: uuidv4(),
    name: 'Sinusoidal Drift',
    description: 'Use sinusoidal components to navigate a wavy field.',
    start: { x: -3, y: 0.2 },
    target: { x: 3.2, y: 0.2 },
    obstacles: [{ x: -1, y: 0.8 }, { x: 1.2, y: -0.5 }, { x: 0.1, y: 0.1 }],
    bounds: { xmin: -6, xmax: 6, ymin: -3, ymax: 3 }
  }
];
