export const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

function clearStoredSession() {
  localStorage.removeItem('civicfix_token');
  localStorage.removeItem('civicfix_user');
  window.dispatchEvent(new Event('civicfix:auth-expired'));
}

export async function api(path, options = {}) {
  const token = localStorage.getItem('civicfix_token');
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error('Could not reach the server. Please check that the API is running and try again.');
  }

  const contentType = response.headers.get('content-type') || '';
  const data = response.status === 204
    ? null
    : contentType.includes('application/json')
      ? await response.json()
      : { message: await response.text() };

  if (response.status === 401 && path !== '/auth/login') {
    clearStoredSession();
    throw new Error('Your session expired. Please sign in again.');
  }
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`);
  return data;
}
