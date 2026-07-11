export const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

function clearStoredSession() {
  localStorage.removeItem('civicfix_token');
  localStorage.removeItem('civicfix_user');
  window.dispatchEvent(new Event('civicfix:auth-expired'));
}

export async function api(path, options = {}) {
  const token = localStorage.getItem('civicfix_token');
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = response.status === 204 ? null : await response.json();
  if (response.status === 401) {
    clearStoredSession();
    throw new Error('Your session expired. Please sign in again.');
  }
  if (!response.ok) throw new Error(data?.message || 'Request failed');
  return data;
}
