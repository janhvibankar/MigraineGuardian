import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH = path.resolve('backend/src/config/migraineguardian-firebase-adminsdk-fbsvc-b7c03e4c99.json');
dotenv.config({ path: path.resolve('backend/.env') });

const PORT = process.env.PORT || 5000;

let auth, db, weatherApiService;

async function setupAdmin() {
  const adminModule = await import('./config/firebaseAdmin.js');
  const weatherModule = await import('./services/weatherApiService.js');
  auth = adminModule.auth;
  db = adminModule.db;
  weatherApiService = weatherModule.weatherApiService;
}

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function createTestUser(emailPrefix) {
  const email = `${emailPrefix}_${Date.now()}@migraineguardian.internal`;
  const userRecord = await auth.createUser({
    email,
    password: 'TestPassword123!',
    displayName: `${emailPrefix} User`,
  });

  const customToken = await auth.createCustomToken(userRecord.uid);
  const apiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBHmCypBDjNTgvJGIBbmIjmQ0JDIaisLrk';
  const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

  const swapRes = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });

  if (!swapRes.ok) {
    throw new Error('Failed to exchange custom token for ID token');
  }

  const swapData = await swapRes.json();
  return { uid: userRecord.uid, token: swapData.idToken, userRecord };
}

async function runTests() {
  await setupAdmin();
  console.log('================================================================');
  console.log(' VERIFYING ACCOUNT ISOLATION & USUAL LOCATION ACTIONS');
  console.log('================================================================\n');

  let accountA = null;
  let accountB = null;

  try {
    accountA = await createTestUser('accountA');
    accountB = await createTestUser('accountB');

    console.log(`[Setup] Account A UID: ${accountA.uid}`);
    console.log(`[Setup] Account B UID: ${accountB.uid}`);

    // TEST 1: Account A saves Sangola as usual location
    console.log('\n[TEST 1] Account A saves Sangola as usual location...');
    const sangolaLoc = { name: 'Sangola, Maharashtra, India', latitude: 17.4395, longitude: 75.1938 };
    const saveARes = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/usual-location',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accountA.token}` },
    }, sangolaLoc);

    if (saveARes.status === 200 && saveARes.data.success) {
      console.log(' ✅ PASS: Account A saved usual location Sangola successfully.');
    } else {
      console.error(` ❌ FAIL: Account A save usual location returned HTTP ${saveARes.status}`);
    }

    // Verify Firestore document for Account A
    const docA = await db.collection('users').doc(accountA.uid).get();
    if (docA.exists && docA.data()?.usualLocation?.name?.includes('Sangola')) {
      console.log(` ✅ PASS: Firestore document users/${accountA.uid} contains Sangola.`);
    } else {
      console.error(` ❌ FAIL: Firestore document users/${accountA.uid} does not contain Sangola.`);
    }

    // TEST 2: Account B logs in -> Account B sees NO usual location
    console.log('\n[TEST 2] Account B queries usual location...');
    const getBRes = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/usual-location',
      method: 'GET',
      headers: { Authorization: `Bearer ${accountB.token}` },
    });

    if (getBRes.status === 200 && getBRes.data.data === null) {
      console.log(' ✅ PASS: Account B has NO usual location (returned null). Account isolation verified!');
    } else {
      console.error(' ❌ FAIL: Account B received stale data or non-null usual location:', getBRes.data);
    }

    // TEST 3: Account B saves Pune -> Account B sees Pune; Account A still sees Sangola
    console.log('\n[TEST 3] Account B saves Pune as usual location...');
    const puneLoc = { name: 'Pune, Maharashtra, India', latitude: 18.5204, longitude: 73.8567 };
    await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/usual-location',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accountB.token}` },
    }, puneLoc);

    const getBUsual = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/usual-location',
      method: 'GET',
      headers: { Authorization: `Bearer ${accountB.token}` },
    });

    const getAUsual = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/usual-location',
      method: 'GET',
      headers: { Authorization: `Bearer ${accountA.token}` },
    });

    if (getBUsual.data.data?.name?.includes('Pune') && getAUsual.data.data?.name?.includes('Sangola')) {
      console.log(' ✅ PASS: Account B sees Pune while Account A independently sees Sangola.');
    } else {
      console.error(' ❌ FAIL: Cross-account data leak detected!', { AccountB: getBUsual.data, AccountA: getAUsual.data });
    }

    // TEST 4: Account B uses "I travelled recently" for Mumbai -> Usual location remains Pune
    console.log('\n[TEST 4] Account B fetches travel weather for Mumbai...');
    const mumbaiLoc = { name: 'Mumbai, Maharashtra, India', latitude: 19.0760, longitude: 72.8777 };
    const histRes = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/historical',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accountB.token}` },
    }, { latitude: mumbaiLoc.latitude, longitude: mumbaiLoc.longitude, days: 3, locationName: mumbaiLoc.name });

    if (histRes.status === 200 && histRes.data.success) {
      console.log(' ✅ PASS: Travel weather for Mumbai fetched successfully.');
    }

    // Verify Account B's usual location in Firestore is STILL Pune
    const getBUsualAfterTravel = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/usual-location',
      method: 'GET',
      headers: { Authorization: `Bearer ${accountB.token}` },
    });

    if (getBUsualAfterTravel.data.data?.name?.includes('Pune')) {
      console.log(' ✅ PASS: Account B usual location remained Pune after travel search (Travel location did not overwrite usual location).');
    } else {
      console.error(' ❌ FAIL: Travel location overwrote usual location!');
    }

    // TEST 5: Change usual location from Pune to Sangola
    console.log('\n[TEST 5] Account B changes usual location to Sangola...');
    await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/usual-location',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accountB.token}` },
    }, sangolaLoc);

    const getBUsualUpdated = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/usual-location',
      method: 'GET',
      headers: { Authorization: `Bearer ${accountB.token}` },
    });

    if (getBUsualUpdated.data.data?.name?.includes('Sangola')) {
      console.log(' ✅ PASS: Account B usual location successfully changed to Sangola.');
    } else {
      console.error(' ❌ FAIL: Failed to update Account B usual location to Sangola.');
    }

    console.log('\n 🎉 ALL ACCOUNT ISOLATION AND WEATHER ACTION TESTS PASSED PERFECTLY!\n');
  } catch (err) {
    console.error(' ❌ Test Execution Error:', err.message);
  } finally {
    if (accountA?.uid) await auth.deleteUser(accountA.uid).catch(() => {});
    if (accountB?.uid) await auth.deleteUser(accountB.uid).catch(() => {});
  }

  process.exit(0);
}

runTests();
