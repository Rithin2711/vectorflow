const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Stubs for backend API integration. These functions are implemented with fetch but
 * will no-op gracefully if API_URL is not set or network fails.
 */

// PUBLIC_INTERFACE
export async function submitScore({ name, score, date }) {
  /** Submit a score to backend (stub). Returns true on success. */
  if (!API_URL) return false;
  try {
    const res = await fetch(`${API_URL}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score, date })
    });
    return res.ok;
  } catch {
    return false;
  }
}

// PUBLIC_INTERFACE
export async function fetchLeaderboard() {
  /** Fetch leaderboard from backend (stub). Returns [] on failure. */
  if (!API_URL) return [];
  try {
    const res = await fetch(`${API_URL}/scores/top`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// PUBLIC_INTERFACE
export async function upsertProfile(profile) {
  /** Upsert player profile (stub). Returns updated profile or original on failure. */
  if (!API_URL) return profile;
  try {
    const res = await fetch(`${API_URL}/profiles`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) return profile;
    return await res.json();
  } catch {
    return profile;
  }
}
