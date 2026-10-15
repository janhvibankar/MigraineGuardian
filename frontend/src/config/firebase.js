import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  GoogleAuthProvider,
} from 'firebase/auth';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (process.env || {});

const rawApiKey = env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: rawApiKey || "AIzaSyDummyApiKeyForLocalDevelopmentOnly",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "migraineguardian.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "migraineguardian",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "migraineguardian.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Safe development-only diagnostic logging (Never prints actual key value)
if (env.DEV) {
  const isPopulated = typeof rawApiKey === 'string' && rawApiKey.trim().length > 0;
  const isDummyKey = rawApiKey === "AIzaSyDummyApiKeyForLocalDevelopmentOnly";
  
  console.log('[Firebase Config Diagnostic]', {
    viteEnvApiKeyStatus: !rawApiKey ? 'undefined/empty' : isDummyKey ? 'placeholder_dummy' : 'populated_custom',
    runtimeApiKeyPopulated: Boolean(firebaseConfig.apiKey),
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  });
}

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with multi-tier persistence fallback:
// Primary: indexedDBLocalPersistence (standard web persistence)
// Fallback: browserLocalPersistence (localStorage when IndexedDB is closing or blocked)
// Fallback: inMemoryPersistence (in-memory session resilience)
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
  });
} catch (err) {
  // Only fall back to getAuth if initializeAuth was already called for this App instance (e.g. HMR)
  if (err?.code === 'auth/already-initialized') {
    authInstance = getAuth(app);
  } else {
    // Never conceal genuine configuration or initialization errors
    throw err;
  }
}

export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();


