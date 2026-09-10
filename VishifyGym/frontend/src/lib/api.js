const LOCAL_URL = 'http://localhost:4000/api';
const PROD_URL = 'https://vishify-gym.vercel.app/api';
const QUEUE_KEY = 'vishify-offline-queue';
const TOKEN_KEY = 'vishify-token';

const resolveApiBase = () => {
  const override = import.meta.env.VITE_API_URL;
  if (override) return override.replace(/\/$/, '');
  return import.meta.env.DEV ? LOCAL_URL : PROD_URL;
};

export const API_BASE = resolveApiBase();
export { TOKEN_KEY };
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('vishify-auth:unauthorized'));
  }
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Request failed');
  return response.status === 204 ? null : response.json();
}

export const readQueue = () => JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
export const queue = (operation) => localStorage.setItem(QUEUE_KEY, JSON.stringify([...readQueue(), operation]));
export async function flushQueue() {
  const jobs = readQueue();
  if (!jobs.length || !navigator.onLine) return 0;
  const remaining = [];
  for (const job of jobs) {
    try { await request(job.path, job.options); } catch { remaining.push(job); }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return jobs.length - remaining.length;
}