/**
 * Local storage helpers for VectorFlow.
 */

const LS_KEYS = {
  PROFILE: 'vf_profile',
  LEADERBOARD: 'vf_leaderboard',
  SETTINGS: 'vf_settings'
};

// PUBLIC_INTERFACE
export function loadProfile() {
  try {
    const raw = localStorage.getItem(LS_KEYS.PROFILE);
    return raw ? JSON.parse(raw) : { name: 'Player', bestTimes: {} };
  } catch {
    return { name: 'Player', bestTimes: {} };
  }
}

// PUBLIC_INTERFACE
export function saveProfile(profile) {
  localStorage.setItem(LS_KEYS.PROFILE, JSON.stringify(profile));
}

// PUBLIC_INTERFACE
export function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LS_KEYS.LEADERBOARD);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// PUBLIC_INTERFACE
export function saveLeaderboard(board) {
  localStorage.setItem(LS_KEYS.LEADERBOARD, JSON.stringify(board));
}

// PUBLIC_INTERFACE
export function submitScore(challengeId, playerName, time) {
  const board = loadLeaderboard();
  if (!board[challengeId]) board[challengeId] = [];
  board[challengeId].push({ player: playerName, time, at: Date.now() });
  // Keep top 10 fastest
  board[challengeId].sort((a, b) => a.time - b.time);
  board[challengeId] = board[challengeId].slice(0, 10);
  saveLeaderboard(board);
  return board[challengeId];
}

// PUBLIC_INTERFACE
export function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : { integrator: 'rk4', dt: 0.02, showQuiver: true };
  } catch {
    return { integrator: 'rk4', dt: 0.02, showQuiver: true };
  }
}

// PUBLIC_INTERFACE
export function saveSettings(settings) {
  localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(settings));
}
