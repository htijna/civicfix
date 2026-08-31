const hostname = window.location.hostname;
const isLocalNetwork = ['localhost', '127.0.0.1'].includes(hostname) ||
  /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname);

export const API = isLocalNetwork
  ? `${window.location.protocol}//${hostname}:5000/api`
  : import.meta.env.VITE_API_URL || 'https://civicfix-vvrx.onrender.com/api';


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
    if (localStorage.getItem('civicfix_token') === token) clearStoredSession();
    throw new Error('Your session expired. Please sign in again.');
  }
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`);
  return data;
}
