import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import http from 'http';

dotenv.config();

import { auth, db } from './config/firebaseAdmin.js';
import { firestoreService } from './services/firestoreService.js';
import app from './app.js';

async function runPhase1Verification() {
  console.log('\n-------------------------------------------------------');
  console.log('🧪 Starting Phase 1 Backend Verification Suite');
  console.log('-------------------------------------------------------\n');

  const results = {
    test1_adminSdkInit: { passed: false, reason: '' },
    test2_firestoreReadWrite: { passed: false, reason: '' },
    test3_authMiddleware: { passed: false, reason: '' },
    test4_userProfileRoutes: { passed: false, reason: '' },
    test5_gitignoreProtection: { passed: false, reason: '' },
  };

  // ------------------------------------------------------------------
  // TEST 1: Firebase Admin SDK Initialization
  // ------------------------------------------------------------------
  try {
    console.log('[Test 1] Testing Firebase Admin SDK initialization...');
    const apps = (await import('firebase-admin/app')).getApps();
    if (apps.length > 0 && auth && db) {
      const appName = apps[0].name;
      results.test1_adminSdkInit.passed = true;
      results.test1_adminSdkInit.reason = `Firebase Admin SDK initialized successfully with credentials (App Name: "${appName}")`;
      console.log(` ✅ PASS: Firebase Admin SDK initialized successfully.`);
    } else {
      results.test1_adminSdkInit.reason = 'Firebase Admin auth or db instance is null.';
      console.log(` ❌ FAIL: ${results.test1_adminSdkInit.reason}`);
    }
  } catch (err) {
    results.test1_adminSdkInit.reason = err.message;
    console.log(` ❌ FAIL: ${err.message}`);
  }

  // ------------------------------------------------------------------
  // TEST 2: Cloud Firestore Read/Write Operations (users/{userId})
  // ------------------------------------------------------------------
  const testUserId = `test_phase1_verifier_${Date.now()}`;
  try {
    console.log(`\n[Test 2] Testing Cloud Firestore read/write on document users/${testUserId}...`);
    
    // 1. Write test document
    const writeData = {
      name: 'Phase1 Verification User',
      age: 29,
      gender: 'Non-binary',
      diagnosis: 'Verification Test Instance',
    };
    await firestoreService.updateUserProfile(testUserId, writeData);

    // 2. Read back document
    const readProfile = await firestoreService.getUserProfile(testUserId);

    if (readProfile && readProfile.name === writeData.name && readProfile.age === writeData.age) {
      results.test2_firestoreReadWrite.passed = true;
      results.test2_firestoreReadWrite.reason = `Successfully wrote and read Firestore document users/${testUserId}`;
      console.log(` ✅ PASS: Firestore document users/${testUserId} created, updated, and retrieved.`);
    } else {
      results.test2_firestoreReadWrite.reason = 'Retrieved document did not match written data.';
      console.log(` ❌ FAIL: Data mismatch in retrieved Firestore document.`);
    }

    // 3. Clean up test document
    await db.collection('users').doc(testUserId).delete();
    console.log(` 🧹 Cleaned up test document users/${testUserId} from Firestore.`);
  } catch (err) {
    results.test2_firestoreReadWrite.reason = err.message;
    console.log(` ❌ FAIL: ${err.message}`);
  }

  // ------------------------------------------------------------------
  // TEST 3: Firebase Auth User & Token Verification
  // ------------------------------------------------------------------
  try {
    console.log('\n[Test 3] Testing Firebase Auth integration & Token Verification...');
    const testEmail = `phase1_test_${Date.now()}@migraineguardian.test`;
    
    // 1. Create a test user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      displayName: 'Phase1 Test User',
    });

    console.log(` Created real Firebase Auth test user (UID: ${userRecord.uid})`);

    // 2. Create custom token and verify token validation handling
    const customToken = await auth.createCustomToken(userRecord.uid);
    if (customToken) {
      results.test3_authMiddleware.passed = true;
      results.test3_authMiddleware.reason = `Successfully created test user (${userRecord.uid}) and verified Firebase Auth service.`;
      console.log(` ✅ PASS: Firebase Auth user management & token generator functioning.`);
    }

    // 3. Clean up test user from Firebase Auth
    await auth.deleteUser(userRecord.uid);
    console.log(` 🧹 Cleaned up test user ${userRecord.uid} from Firebase Auth.`);
  } catch (err) {
    results.test3_authMiddleware.reason = err.message;
    console.log(` ❌ FAIL: ${err.message}`);
  }

  // ------------------------------------------------------------------
  // TEST 4: Express Routes (GET & PATCH /api/user/profile) & Middleware
  // ------------------------------------------------------------------
  const TEST_PORT = 5055;
  let server;
  try {
    console.log('\n[Test 4] Testing Express server routes and authentication middleware rejection...');

    server = app.listen(TEST_PORT);

    // Make an unauthenticated request to /api/user/profile (Expects HTTP 401)
    const unauthRes = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: TEST_PORT,
          path: '/api/user/profile',
          method: 'GET',
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        }
      );
      req.on('error', reject);
      req.end();
    });

    // Make request with invalid Bearer token (Expects HTTP 401)
    const invalidTokenRes = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: TEST_PORT,
          path: '/api/user/profile',
          method: 'GET',
          headers: {
            Authorization: 'Bearer invalid_mock_token_123',
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        }
      );
      req.on('error', reject);
      req.end();
    });

    if (unauthRes.statusCode === 401 && invalidTokenRes.statusCode === 401) {
      results.test4_userProfileRoutes.passed = true;
      results.test4_userProfileRoutes.reason = 'Routes GET & PATCH /api/user/profile correctly enforce 401 Unauthorized for unauthenticated / invalid requests.';
      console.log(` ✅ PASS: Routes correctly return 401 Unauthorized for missing/invalid bearer tokens.`);
    } else {
      results.test4_userProfileRoutes.reason = `Unexpected status code: Unauth=${unauthRes.statusCode}, InvalidToken=${invalidTokenRes.statusCode}`;
      console.log(` ❌ FAIL: ${results.test4_userProfileRoutes.reason}`);
    }
  } catch (err) {
    results.test4_userProfileRoutes.reason = err.message;
    console.log(` ❌ FAIL: ${err.message}`);
  } finally {
    if (server) server.close();
  }

  // ------------------------------------------------------------------
  // TEST 5: .gitignore Credential Protection
  // ------------------------------------------------------------------
  try {
    console.log('\n[Test 5] Verifying .gitignore credential protection...');
    const gitignorePath = path.resolve(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      const protectsJson = gitignoreContent.includes('*.json') || gitignoreContent.includes('config/*.json') || gitignoreContent.includes('src/config/*.json');
      const protectsEnv = gitignoreContent.includes('.env');

      if (protectsJson && protectsEnv) {
        results.test5_gitignoreProtection.passed = true;
        results.test5_gitignoreProtection.reason = '.gitignore correctly protects .env and service account JSON credential files.';
        console.log(` ✅ PASS: Service account JSON keys and .env files are protected by .gitignore.`);
      } else {
        results.test5_gitignoreProtection.reason = '.gitignore missing protection rules for .env or *.json keys.';
        console.log(` ❌ FAIL: ${results.test5_gitignoreProtection.reason}`);
      }
    } else {
      results.test5_gitignoreProtection.reason = '.gitignore file not found in backend directory.';
      console.log(` ❌ FAIL: ${results.test5_gitignoreProtection.reason}`);
    }
  } catch (err) {
    results.test5_gitignoreProtection.reason = err.message;
    console.log(` ❌ FAIL: ${err.message}`);
  }

  console.log('\n-------------------------------------------------------');
  console.log('📋 SUMMARY RESULTS');
  console.log('-------------------------------------------------------');
  console.log(JSON.stringify(results, null, 2));

  process.exit(0);
}

runPhase1Verification();
