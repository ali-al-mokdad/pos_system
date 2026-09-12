const BASE = import.meta.env.VITE_API_URL || '/api';

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export function getToken() {
  return localStorage.getItem('pos-token');
}

export function setToken(token) {
  if (token) localStorage.setItem('pos-token', token);
  else localStorage.removeItem('pos-token');
}

async function request(method, path, body, { isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch (e) {
    throw new Error('Cannot reach the POS server. Check the local network connection.');
  }

  if (res.status === 401) {
    setToken(null);
    if (onUnauthorized) onUnauthorized();
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = data && data.errors;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b, o) => request('POST', p, b, o),
  put: (p, b, o) => request('PUT', p, b, o),
  del: (p) => request('DELETE', p),
};

export function qs(params) {
  const entries = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== '' && v !== null);
  return entries.length ? `?${new URLSearchParams(entries).toString()}` : '';
}
