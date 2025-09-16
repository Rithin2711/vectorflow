const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

/**
 * PUBLIC_INTERFACE
 * Example API call to submit a leaderboard entry.
 * In absence of backend, we no-op and resolve locally.
 */
export async function submitScore(entry) {
  if (!API_BASE) {
    // No backend configured; returning simulated response.
    return { ok: true, saved: false, entry };
  }
  try {
    const res = await fetch(`${API_BASE}/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    const data = await res.json();
    return { ok: res.ok, ...data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
