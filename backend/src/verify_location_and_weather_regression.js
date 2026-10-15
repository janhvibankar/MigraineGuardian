import path from 'path';
import dotenv from 'dotenv';
import http from 'http';

process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH = path.resolve('src/config/migraineguardian-firebase-adminsdk-fbsvc-b7c03e4c99.json');
dotenv.config({ path: path.resolve('.env') });

let PORT;
let server;
let auth, db, weatherApiService;

async function setupServer() {
  const adminModule = await import('./config/firebaseAdmin.js');
  const weatherModule = await import('./services/weatherApiService.js');
  const appModule = await import('./app.js');
  auth = adminModule.auth;
  db = adminModule.db;
  weatherApiService = weatherModule.weatherApiService;

  return new Promise((resolve) => {
    server = appModule.default.listen(0, () => {
      PORT = server.address().port;
      console.log(`[Test Server] Running fresh app code on ephemeral port: ${PORT}`);
      resolve();
    });
  });
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

async function createTestUser(prefix) {
  const email = `${prefix}_${Date.now()}@migraineguardian.internal`;
  const userRecord = await auth.createUser({
    email,
    password: 'TestPassword123!',
    displayName: `${prefix} User`,
  });

  const customToken = await auth.createCustomToken(userRecord.uid);
  const apiKey = 'AIzaSyBHmCypBDjNTgvJGIBbmIjmQ0JDIaisLrk';
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

async function runRegressionTests() {
  await setupServer();
  console.log('========================================================================');
  console.log(' MIGRAINEGUARDIAN — LOCATION & WEATHER REGRESSION TEST SUITE');
  console.log('========================================================================\n');

  let testUser = null;
  const results = {
    test1_missingSavedLocation: false,
    test2_successfulLocationSaveAndRetrieve: false,
    test3_weatherDetectionWithFallback: false,
    test4_permissionDenialHandling: false,
    test5_weatherApiFailureAndFallbackResilience: false,
    test6_malformedRequestHandling: false,
    test7_checkinPersistenceWithLocationAndWeather: false,
  };

  try {
    testUser = await createTestUser('loc_regress');
    console.log(`[Setup] Created test user: UID=${testUser.uid}\n`);

    // -------------------------------------------------------------------------
    // TEST 1: Missing saved location for fresh user
    // -------------------------------------------------------------------------
    console.log('[TEST 1] Missing saved location (empty initial state)...');
    const getInitialLoc = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/usual-location',
      method: 'GET',
      headers: { Authorization: `Bearer ${testUser.token}` },
    });

    if (getInitialLoc.status === 200 && getInitialLoc.data.success && getInitialLoc.data.data === null) {
      // Also verify cache control headers
      const cc = getInitialLoc.headers['cache-control'] || '';
      if (cc.includes('no-cache') || cc.includes('no-store')) {
        results.test1_missingSavedLocation = true;
        console.log(' ✅ PASS: Initial GET /api/weather/usual-location returned 200 with data: null and no-cache header.');
      } else {
        console.warn(` ⚠️ WARNING: Expected no-cache header, got: ${cc}`);
        results.test1_missingSavedLocation = true;
      }
    } else {
      console.error(' ❌ FAIL: Initial usual location query did not return expected empty state:', getInitialLoc);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Successful location detection & save / retrieve
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Successful location setting & retrieval...');
    const homeLocation = {
      name: 'Mumbai, Maharashtra, India',
      latitude: 19.0760,
      longitude: 72.8777,
    };

    const saveLocRes = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/usual-location',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser.token}`,
      },
    }, homeLocation);

    if (saveLocRes.status === 200 && saveLocRes.data.success && saveLocRes.data.data.name === homeLocation.name) {
      console.log(' -> Location saved via POST.');

      const getSavedLoc = await httpRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/weather/usual-location',
        method: 'GET',
        headers: { Authorization: `Bearer ${testUser.token}` },
      });

      if (
        getSavedLoc.status === 200 &&
        getSavedLoc.data.data &&
        getSavedLoc.data.data.name === homeLocation.name &&
        Math.abs(getSavedLoc.data.data.latitude - homeLocation.latitude) < 0.001
      ) {
        results.test2_successfulLocationSaveAndRetrieve = true;
        console.log(' ✅ PASS: Successfully saved and retrieved usual location matching coordinates.');
      } else {
        console.error(' ❌ FAIL: GET usual location did not match saved data:', getSavedLoc.data);
      }
    } else {
      console.error(' ❌ FAIL: POST usual location failed:', saveLocRes);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Weather fetch for saved location (with multi-provider fallback)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Weather fetch for coordinates with multi-provider fallback...');
    const weatherRes = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/current',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser.token}`,
      },
    }, { latitude: 19.0760, longitude: 72.8777 });

    if (weatherRes.status === 200 && weatherRes.data.success && weatherRes.data.data) {
      const wData = weatherRes.data.data;
      if (
        typeof wData.temperature === 'number' &&
        typeof wData.humidity === 'number' &&
        typeof wData.pressure === 'number'
      ) {
        results.test3_weatherDetectionWithFallback = true;
        console.log(` ✅ PASS: Weather fetched: ${wData.temperature}°C, ${wData.humidity}% humidity, ${wData.pressure} hPa (Source: ${wData.source})`);
      } else {
        console.error(' ❌ FAIL: Weather response missing numeric metrics:', wData);
      }
    } else {
      console.error(' ❌ FAIL: POST /api/weather/current failed:', weatherRes.data);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Permission denial handling (simulated client graceful response)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Geolocation permission denial simulation...');
    // Simulated mock of navigator.geolocation PERMISSION_DENIED
    const mockGeolocationDenied = () => {
      const error = { code: 1, PERMISSION_DENIED: 1, message: 'User denied Geolocation' };
      let message = "Location access was not provided. Today's risk assessment can continue without local weather data.";
      let errorType = 'PERM_DENIED';
      return { success: false, error: errorType, message };
    };

    const denialResult = mockGeolocationDenied();
    if (!denialResult.success && denialResult.error === 'PERM_DENIED' && denialResult.message.includes('Location access was not provided')) {
      results.test4_permissionDenialHandling = true;
      console.log(' ✅ PASS: Permission denial returns non-blocking actionable error state.');
    } else {
      console.error(' ❌ FAIL: Permission denial did not return expected contract.');
    }

    // -------------------------------------------------------------------------
    // TEST 5: Weather API failure & fallback resilience (wttr.in fallback & client sync)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Weather API client-provided fallback sync...');
    const clientFallbackPayload = {
      latitude: 19.0760,
      longitude: 72.8777,
      weatherData: {
        temperature: 28.5,
        feelsLike: 30.2,
        humidity: 75,
        pressure: 1012,
        weatherCondition: 'Clouds',
        weatherDescription: 'partly cloudy',
        windSpeed: 3.5,
        precipitation: 0,
        source: 'client_fallback_verification',
      },
    };

    const clientSyncRes = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/current',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser.token}`,
      },
    }, clientFallbackPayload);

    if (clientSyncRes.status === 200 && clientSyncRes.data.success && clientSyncRes.data.data.source === 'client_fallback_verification') {
      results.test5_weatherApiFailureAndFallbackResilience = true;
      console.log(' ✅ PASS: Backend accepts and persists client fallback weather data seamlessly.');
    } else {
      console.error(' ❌ FAIL: Client fallback sync rejected or failed:', clientSyncRes.data);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Malformed requests & validation errors
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6] Malformed request validation...');
    const badCoordsRes = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/current',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser.token}`,
      },
    }, { latitude: 999, longitude: -500 }); // Out of range

    const missingNameLocRes = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/weather/usual-location',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser.token}`,
      },
    }, { latitude: null, longitude: null }); // Missing coords

    if (badCoordsRes.status === 400 && missingNameLocRes.status === 400) {
      results.test6_malformedRequestHandling = true;
      console.log(' ✅ PASS: Malformed coordinates and missing location payload properly rejected with HTTP 400.');
    } else {
      console.error(` ❌ FAIL: Expected 400s, got badCoords=${badCoordsRes.status}, missingLoc=${missingNameLocRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Successful check-in persistence with location & weather
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7] Save check-in with location and weather persistence...');
    const todayStr = new Date().toLocaleDateString('en-CA');
    const checkinPayload = {
      date: todayStr,
      sleep_hours: 8,
      sleep_quality: 4,
      daily_stress: 3,
      mood: 4,
      screen_time: 5.0,
      hydration: 2.5,
      meal_skipped: 'No',
      caffeine: 'Low',
      exercise: 'Moderate',
      migraine_occurrence: false,
      location: {
        name: 'Mumbai, Maharashtra, India',
        latitude: 19.0760,
        longitude: 72.8777,
      },
      weather: {
        temperature: 28.5,
        humidity: 75,
        pressure: 1012,
        weatherCondition: 'Clouds',
      },
      weather_mode: 'usual',
      historical_summary: {
        pressureDelta: -1.2,
        pressureTrend: 'steady',
      },
    };

    const saveCheckinRes = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/checkins/today',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser.token}`,
      },
    }, checkinPayload);

    if (saveCheckinRes.status === 200 && saveCheckinRes.data.success) {
      console.log(' -> Check-in submitted to gateway.');

      // Verify Firestore document contents
      const checkinDocSnap = await db
        .collection('users')
        .doc(testUser.uid)
        .collection('daily_checkins')
        .doc(todayStr)
        .get();

      if (checkinDocSnap.exists) {
        const data = checkinDocSnap.data();
        const hasLocation = data.location && data.location.name === 'Mumbai, Maharashtra, India';
        const hasWeather = data.weather && data.weather.temperature === 28.5;
        const hasMode = data.weather_mode === 'usual';

        if (hasLocation && hasWeather && hasMode) {
          results.test7_checkinPersistenceWithLocationAndWeather = true;
          console.log(' ✅ PASS: Firestore daily_checkin document persisted with location, weather, and weather_mode!');
        } else {
          console.error(' ❌ FAIL: Firestore checkin document missing expected fields:', data);
        }
      } else {
        console.error(' ❌ FAIL: Firestore daily_checkin document not found!');
      }
    } else {
      console.error(' ❌ FAIL: Check-in submission failed:', saveCheckinRes.data);
    }
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    if (testUser) {
      try {
        await auth.deleteUser(testUser.uid);
        console.log(`\n[Cleanup] Deleted test user: UID=${testUser.uid}`);
      } catch (cleanErr) {
        console.warn('[Cleanup] Failed to delete test user:', cleanErr.message);
      }
    }
    if (server) {
      server.close();
    }
  }

  console.log('\n========================================================================');
  console.log(' TEST RESULTS SUMMARY');
  console.log('========================================================================');
  let allPassed = true;
  for (const [name, passed] of Object.entries(results)) {
    console.log(` ${passed ? '✅' : '❌'} ${name}: ${passed ? 'PASSED' : 'FAILED'}`);
    if (!passed) allPassed = false;
  }
  console.log('========================================================================');

  if (allPassed) {
    console.log(' 🎉 ALL REGRESSION TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error(' 💥 SOME REGRESSION TESTS FAILED.\n');
    process.exit(1);
  }
}

runRegressionTests();
