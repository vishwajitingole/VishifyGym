const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const QUEUE_KEY = 'vishify-offline-queue';

export async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Request failed');
  return response.status === 204 ? null : response.json();
}
export const readQueue = () => JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
export const queue = (operation) => localStorage.setItem(QUEUE_KEY, JSON.stringify([...readQueue(), operation]));
export async function flushQueue() {
  const jobs = readQueue(); if (!jobs.length || !navigator.onLine) return 0;
  const remaining = [];
  for (const job of jobs) { try { await request(job.path, job.options); } catch { remaining.push(job); } }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining)); return jobs.length - remaining.length;
}
