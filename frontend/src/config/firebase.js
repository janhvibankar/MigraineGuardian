import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: rawApiKey || "AIzaSyDummyApiKeyForLocalDevelopmentOnly",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "migraineguardian.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "migraineguardian",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "migraineguardian.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Safe development-only diagnostic logging (Never prints actual key value)
if (import.meta.env.DEV) {
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
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();


