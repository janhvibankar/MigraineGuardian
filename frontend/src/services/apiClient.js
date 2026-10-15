import { auth } from '../config/firebase.js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (process.env || {});

// Resolve and normalize API_BASE_URL
// 1. In dev mode without env var -> http://localhost:5001/api
// 2. In prod mode without env var -> https://migraineguardian-backend.onrender.com/api (never bare /api on static host)
// 3. If env var is provided without /api (e.g. https://migraineguardian-backend.onrender.com), automatically append /api
function resolveApiBaseUrl() {
  const configured = env.VITE_API_BASE_URL ? env.VITE_API_BASE_URL.trim().replace(/\/+$/, '') : '';
  if (configured) {
    return configured.endsWith('/api') ? configured : `${configured}/api`;
  }
  return env.DEV ? 'http://localhost:5001/api' : 'https://migraineguardian-backend.onrender.com/api';
}

const API_BASE_URL = resolveApiBaseUrl();

// In-flight Promise deduplication map for GET requests (prevents thundering herd on mount)
const inFlightGetRequests = new Map();

// Token cache to prevent repetitive auth token roundtrips across rapid concurrent requests
let cachedToken = null;
let tokenExpiryTime = 0;

if (auth && typeof auth.onAuthStateChanged === 'function') {
  auth.onAuthStateChanged(() => {
    cachedToken = null;
    tokenExpiryTime = 0;
  });
}

async function getAuthToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiryTime > now + 60000) {
    return cachedToken;
  }

  try {
    if (auth) {
      if (typeof auth.authStateReady === 'function') {
        await auth.authStateReady();
      }
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        cachedToken = token;
        // Firebase Auth ID tokens remain valid for 1 hour; cache for 10 minutes safely
        tokenExpiryTime = now + 10 * 60 * 1000;
        return token;
      }
    }
  } catch (e) {
    console.warn('[apiClient] Failed to obtain Firebase ID token from auth.currentUser:', e.message);
  }

  // Fallback to local storage token if available and valid JWT structure
  let storedToken = null;
  if (typeof localStorage !== 'undefined') {
    storedToken = localStorage.getItem('migraineguardian_token') || localStorage.getItem('mg_v1_migraineguardian_token');
  }
  if (storedToken && storedToken.startsWith('eyJ')) {
    return storedToken;
  }

  return null;
}

async function request(endpoint, options = {}) {
  // Absolute URLs (http/https) → use as-is.
  // Root-relative paths (/rag-api/...) → pass through; handled by Vite proxy in dev.
  const isAbsolute = endpoint.startsWith('http://') || endpoint.startsWith('https://');
  const isRagProxy = endpoint.startsWith('/rag-api');
  
  let url;
  if (isAbsolute || isRagProxy) {
    url = endpoint;
  } else {
    // Strip leading slash from endpoint so we don't get /api//checkins
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    url = `${cleanBase}/${cleanEndpoint}`;
  }

  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const shouldDeduplicate = isGet && !options.bypassCache;
  const dedupeKey = shouldDeduplicate ? `${url}` : null;

  if (shouldDeduplicate && inFlightGetRequests.has(dedupeKey)) {
    return inFlightGetRequests.get(dedupeKey);
  }

  const executeCall = async () => {
    const token = await getAuthToken();
    const isAiOperation = url.includes('/predictions') || url.includes('/chat');
    const timeoutMs = options.timeoutMs || (isAiOperation ? 75000 : 30000);
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store',
      'Pragma': 'no-cache',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutTimer);

      if (response.status === 401) {
        console.warn('[apiClient] HTTP 401 Unauthorized from backend gateway.');
        cachedToken = null;
        tokenExpiryTime = 0;
      }

      if (response.status === 304) {
        return {
          ok: true,
          status: 304,
          data: null,
          isNotModified: true,
        };
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
      clearTimeout(timeoutTimer);
      const isTimeout = error.name === 'AbortError';
      console.error(
        `[apiClient] ${isTimeout ? 'Timeout' : 'Network error'} calling ${url}:`,
        error.message
      );
      return {
        ok: false,
        status: isTimeout ? 504 : 0,
        error: {
          code: isTimeout ? 'CLIENT_REQUEST_TIMEOUT' : 'NETWORK_ERROR',
          message: isTimeout
            ? 'Request timed out waiting for server response.'
            : 'Backend service unavailable. Please check your network connection or server status.',
        },
      };
    }
  };

  if (shouldDeduplicate) {
    const promise = executeCall().finally(() => {
      inFlightGetRequests.delete(dedupeKey);
    });
    inFlightGetRequests.set(dedupeKey, promise);
    return promise;
  }

  return executeCall();
}

export const apiClient = {
  get: (endpoint, headers, options = {}) => request(endpoint, { method: 'GET', headers, ...options }),
  post: (endpoint, body, headers, options = {}) => request(endpoint, { method: 'POST', body: JSON.stringify(body), headers, ...options }),
  patch: (endpoint, body, headers, options = {}) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body), headers, ...options }),
  put: (endpoint, body, headers, options = {}) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), headers, ...options }),
  delete: (endpoint, headers, options = {}) => request(endpoint, { method: 'DELETE', headers, ...options }),
  getBaseUrl: () => API_BASE_URL,
  clearTokenCache: () => {
    cachedToken = null;
    tokenExpiryTime = 0;
  },
};

export default apiClient;
