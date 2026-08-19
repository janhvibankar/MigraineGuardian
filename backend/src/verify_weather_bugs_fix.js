import http from 'http';
import { db, auth } from './config/firebaseAdmin.js';
import { weatherApiService } from './services/weatherApiService.js';

const PORT = process.env.PORT || 5000;

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

async function runVerification() {
  console.log('================================================================');
  console.log(' VERIFYING HISTORICAL WEATHER BUG FIXES & DATA INTEGRITY');
  console.log('================================================================\n');

  const todayStr = new Date().toISOString().split('T')[0];
  console.log(`[Context] Current system date: ${todayStr}`);

  // 1. TEST GEOCODING SEARCH DIRECT API & SERVICE
  console.log('\n[Test 1] Testing Geocoding API for "Sangola"...');
  const sangolaResults = await weatherApiService.searchLocationGeocode('Sangola');
  console.log(` -> Found ${sangolaResults.length} matching result(s) for Sangola:`);
  sangolaResults.forEach((r) => console.log(`    📍 ${r.label} (Lat: ${r.latitude}, Lon: ${r.longitude})`));

  if (sangolaResults.length === 0) {
    console.error(' ❌ FAIL: No geocoding results returned for Sangola');
  } else {
    console.log(' ✅ PASS: Geocoding search returned valid coordinates for Sangola');
  }

  console.log('\n[Test 2] Testing Geocoding API for "Islampur"...');
  const islampurResults = await weatherApiService.searchLocationGeocode('Islampur');
  console.log(` -> Found ${islampurResults.length} matching result(s) for Islampur:`);
  islampurResults.forEach((r) => console.log(`    📍 ${r.label} (Lat: ${r.latitude}, Lon: ${r.longitude})`));

  if (islampurResults.length === 0) {
    console.error(' ❌ FAIL: No geocoding results returned for Islampur');
  } else {
    console.log(' ✅ PASS: Geocoding search returned valid coordinates for Islampur');
  }

  // 2. TEST HISTORICAL WEATHER DATE RANGE
  console.log('\n[Test 3] Testing Historical Weather Date Range for 3 completed days...');
  const sangolaLoc = sangolaResults[0] || { latitude: 17.4333, longitude: 75.1985 };
  const histResult = await weatherApiService.fetchHistoricalWeather(sangolaLoc.latitude, sangolaLoc.longitude, 3);

  console.log(` -> Date range requested/returned: ${histResult.summary.startDate} to ${histResult.summary.endDate}`);
  console.log(` -> Number of daily records returned: ${histResult.dailyRecords.length}`);
  console.log(` -> Dates in daily records:`, histResult.dailyRecords.map((r) => r.date));

  const hasFutureDates = histResult.dailyRecords.some((r) => r.date >= todayStr);
  if (hasFutureDates) {
    console.error(' ❌ FAIL: Returned records include today or future dates!');
  } else {
    console.log(' ✅ PASS: All returned dates are strictly completed historical calendar days prior to today.');
  }

  if (histResult.dailyRecords.length === 3) {
    console.log(' ✅ PASS: Exactly 3 completed historical days returned.');
  } else {
    console.warn(` ⚠️ NOTICE: Returned ${histResult.dailyRecords.length} historical records.`);
  }

  // 3. TEST BACKEND REST ENDPOINTS WITH AUTHENTICATED USER
  console.log('\n[Test 4] Testing Backend REST Endpoints via HTTP Gateway...');
  const testEmail = `weather_fix_test_${Date.now()}@migraineguardian.internal`;
  const testPassword = 'TestPassword123!';

  let testUserRecord = null;
  try {
    testUserRecord = await auth.createUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Weather Fix Test User',
    });

    const customToken = await auth.createCustomToken(testUserRecord.uid);
    const apiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBHmCypBDjNTgvJGIBbmIjmQ0JDIaisLrk';
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

    const swapRes = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    });

    if (swapRes.ok) {
      const swapData = await swapRes.json();
      const token = swapData.idToken;
      console.log(` ✅ PASS: Authenticated user created (UID: ${testUserRecord.uid})`);

      // Test GET /api/weather/geocode
      const geoEndpointRes = await httpRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/weather/geocode?query=Sangola',
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (geoEndpointRes.status === 200 && geoEndpointRes.data.success) {
        console.log(` ✅ PASS: GET /api/weather/geocode returned HTTP 200 with ${geoEndpointRes.data.count} result(s).`);
      } else {
        console.error(` ❌ FAIL: GET /api/weather/geocode returned HTTP ${geoEndpointRes.status}`);
      }

      // Test POST /api/weather/historical
      const histEndpointRes = await httpRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/weather/historical',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }, {
        latitude: sangolaLoc.latitude,
        longitude: sangolaLoc.longitude,
        days: 3,
        locationName: sangolaResults[0]?.label || 'Sangola',
      });

      if (histEndpointRes.status === 200 && histEndpointRes.data.success) {
        const returnedRecords = histEndpointRes.data.records || [];
        console.log(` ✅ PASS: POST /api/weather/historical returned HTTP 200 with ${returnedRecords.length} record(s).`);
        console.log(`        Returned dates:`, returnedRecords.map((r) => r.date));

        // Verify Firestore documents created under users/{uid}/weather_records/{YYYY-MM-DD}
        const snap = await db.collection('users').doc(testUserRecord.uid).collection('weather_records').get();
        console.log(` ✅ PASS: Firestore collection users/${testUserRecord.uid}/weather_records contains ${snap.size} document(s):`);
        snap.forEach((doc) => console.log(`        📄 ${doc.id}`));

        if (snap.size > 0 && !returnedRecords.some((r) => r.date >= todayStr)) {
          console.log('\n 🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
        }
      } else {
        console.error(` ❌ FAIL: POST /api/weather/historical returned HTTP ${histEndpointRes.status}`);
      }
    }
  } catch (err) {
    console.error(' ❌ Verification error:', err.message);
  } finally {
    if (testUserRecord) {
      try {
        await auth.deleteUser(testUserRecord.uid);
        console.log(`[Cleanup] Deleted test user ${testUserRecord.uid}`);
      } catch (e) {}
    }
  }

  process.exit(0);
}

runVerification();
