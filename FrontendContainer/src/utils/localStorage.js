const LOCAL_KEY = 'flowquest.leaderboard';

// PUBLIC_INTERFACE
export function loadLocalLeaderboard() {
  /** Loads leaderboard entries from localStorage sorted by score desc. */
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

// PUBLIC_INTERFACE
export function saveLocalLeaderboard(entry) {
  /** Inserts a new entry into localStorage leaderboard. */
  try {
    const list = loadLocalLeaderboard();
    list.push(entry);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}
