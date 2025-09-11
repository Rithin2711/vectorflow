import { v4 as uuidv4 } from 'uuid';

// PUBLIC_INTERFACE
export function createDefaultProfile() {
  /** Create a default player profile structure. */
  return {
    id: uuidv4(),
    name: 'Player',
    avatarSeed: 'Player',
    stats: {
      games: 0,
      bestScore: 0,
      totalScore: 0
    }
  };
}
