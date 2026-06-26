import { authStore } from '@omnidesk/auth';

const BASE_URL = 'http://localhost:1421';

async function request(url: string, options: RequestInit = {}) {
  const token = authStore.state.session?.access_token;
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    return { data };
  }

  return { data: null };
}

export const client = {
  get: (options: { url: string }) => request(options.url, { method: 'GET' }),
  post: (options: { url: string; body?: any }) =>
    request(options.url, { method: 'POST', body: options.body ? JSON.stringify(options.body) : undefined }),
  delete: (options: { url: string }) => request(options.url, { method: 'DELETE' }),
};
