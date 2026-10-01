import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv from cwd and backend directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    const existingApp = getApps()[0];
    return {
      auth: getAuth(existingApp),
      db: getFirestore(existingApp),
    };
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  let credential;

  // 1. Check if Service Account JSON key file path is provided and exists
  const candidatePaths = [
    keyPath && (path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath)),
    keyPath && path.resolve(__dirname, '../../', keyPath),
    path.resolve(__dirname, 'migraineguardian-firebase-adminsdk-fbsvc-b7c03e4c99.json'),
  ].filter(Boolean);

  for (const resolvedPath of candidatePaths) {
    if (fs.existsSync(resolvedPath)) {
      try {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        const serviceAccount = JSON.parse(fileContent);
        credential = cert(serviceAccount);
        console.log(`[Firebase Admin] Successfully loaded credentials from file: ${resolvedPath}`);
        break;
      } catch (err) {
        console.warn(`[Firebase Admin] Failed to parse service account JSON file at ${resolvedPath}:`, err.message);
      }
    }
  }

  // 2. Check if individual environment variables are provided
  if (!credential && projectId && clientEmail && privateKey) {
    try {
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      credential = cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      });
      console.log(`[Firebase Admin] Successfully initialized with environment credentials for project: ${projectId}`);
    } catch (err) {
      console.warn('[Firebase Admin] Failed to initialize credentials from environment variables:', err.message);
    }
  }

  // 3. Fall back to Application Default Credentials (ADC) or placeholder notice
  let app;
  if (credential) {
    app = initializeApp({ credential });
  } else {
    console.warn(
      '[Firebase Admin] WARNING: No Firebase service account credentials found.\n' +
      'Please configure FIREBASE_SERVICE_ACCOUNT_KEY_PATH or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend/.env'
    );
    // Initialize default app (will work if Application Default Credentials exist in GCP environment)
    try {
      app = initializeApp();
    } catch (e) {
      // Stub initialization to prevent instant crash
      app = null;
    }
  }

  return {
    auth: app ? getAuth(app) : null,
    db: app ? getFirestore(app) : null,
  };
}

const { auth, db } = initFirebaseAdmin();

export { auth, db };
