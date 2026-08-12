import { auth } from '../config/firebase.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function getAuthToken() {
  try {
    if (auth && auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
  } catch (e) {
    console.warn('[apiClient] Failed to obtain Firebase ID token from auth.currentUser:', e.message);
  }

  // Fallback to local storage token if available
  return localStorage.getItem('migraineguardian_token') || localStorage.getItem('mg_v1_migraineguardian_token');
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    if (response.status === 401) {
      console.warn('[apiClient] HTTP 401 Unauthorized from backend gateway.');
    }

    const contentType = response.headers.get('content-type');
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { text: await response.text() };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data.error || data || { message: `Request failed with status ${response.status}` },
      };
    }

    return {
      ok: true,
      status: response.status,
      data: data.data !== undefined ? data.data : data,
      raw: data,
    };
  } catch (error) {
    console.error('[apiClient] Network / connection error calling backend:', error.message);
    return {
      ok: false,
      status: 0,
      error: { message: 'Backend service unavailable. Please check your network connection or server status.' },
    };
  }
}

export const apiClient = {
  get: (endpoint, headers) => request(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers) => request(endpoint, { method: 'POST', body: JSON.stringify(body), headers }),
  patch: (endpoint, body, headers) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body), headers }),
  put: (endpoint, body, headers) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), headers }),
  delete: (endpoint, headers) => request(endpoint, { method: 'DELETE', headers }),
  getBaseUrl: () => API_BASE_URL,
};
