import axios from 'axios';

const baseURL = process.env.REACT_APP_API_BASE_URL || '';

export const api = axios.create({
  baseURL,
  timeout: 8000
});

// PUBLIC_INTERFACE
export async function safeGet(path, params) {
  /** Wrapper around axios.get that safely returns data or throws a concise error. */
  try {
    const res = await api.get(path, { params });
    return res.data;
  } catch (e) {
    const msg = e?.response?.data?.message || e.message || 'Request failed';
    throw new Error(msg);
  }
}

// PUBLIC_INTERFACE
export async function safePost(path, body) {
  /** Wrapper around axios.post that safely returns data or throws a concise error. */
  try {
    const res = await api.post(path, body);
    return res.data;
  } catch (e) {
    const msg = e?.response?.data?.message || e.message || 'Request failed';
    throw new Error(msg);
  }
}
