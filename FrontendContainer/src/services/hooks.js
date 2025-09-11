import { useCallback, useState } from 'react';
import { safeGet, safePost } from './apiClient';

// PUBLIC_INTERFACE
export function useLeaderboardAPI() {
  /**
   * Hook for interacting with leaderboard endpoints.
   * Exposes listGlobalScores() and submitScore().
   */
  const [globalScores, setGlobalScores] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listGlobalScores = useCallback(async () => {
    if (!process.env.REACT_APP_API_BASE_URL) {
      setError('Backend not configured');
      setGlobalScores([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await safeGet('/leaderboard', {});
      setGlobalScores(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setGlobalScores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitScore = useCallback(async (entry) => {
    if (!process.env.REACT_APP_API_BASE_URL) {
      setError('Backend not configured');
      return;
    }
    try {
      await safePost('/leaderboard', entry);
      await listGlobalScores();
    } catch (e) {
      setError(e.message);
    }
  }, [listGlobalScores]);

  return { listGlobalScores, submitScore, globalScores, isLoading, error };
}
