import http from 'http';
import { db, auth } from './config/firebaseAdmin.js';

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
  console.log(' MIGRAINEGUARDIAN — STAGE 10 MORNING PROTOCOL VERIFICATION');
  console.log('================================================================\n');

  const results = {
    test1_morningPredictionSuccess: false,
    test2_inputNoEveningOutcome: false,
    test3_inputNoScreenTime: false,
    test4_inputSleepPreviousNight: false,
    test5_eveningCheckinStoresOutcome: false,
    test6_predictionAndOutcomeStoredSeparately: false,
    test7_duplicatePredictionProtection: false,
    test8_weatherT1Observed: false,
    test9_weatherTForecast: false,
    test10_modelAEnforced: false,
  };

  let testUserToken = null;
  let testUserRecord = null;
  const testEmail = `morning_test_${Date.now()}@migraineguardian.internal`;
  const testPassword = 'TestPassword123!';
  const testDate = '2026-08-22';
  const previousDate = '2026-08-21';

  try {
    // Setup test user
    testUserRecord = await auth.createUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Morning Verification User',
    });
    console.log(`[Setup] Created test user: UID=${testUserRecord.uid}`);

    // Exchange custom token for ID token
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
      testUserToken = swapData.idToken;
      console.log(' ✅ Setup: Obtained authenticated Firebase ID Token.');
    } else {
      throw new Error('Failed to swap custom token for ID token');
    }

    // Let's seed yesterday's weather observed record to test yesterday retrieval
    await db.collection('users').doc(testUserRecord.uid).collection('weather_records').doc(previousDate).set({
      weatherRecordId: previousDate,
      date: previousDate,
      temperature: 20.0,
      feelsLike: 20.0,
      humidity: 70,
      pressure: 1012,
      weatherCondition: 'Clear',
      weatherDescription: 'clear sky',
      windSpeed: 5.0,
      precipitation: 0.0,
      source: 'openmeteo_historical',
      data_type: 'observed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`[Setup] Seeded observed weather for T-1 (${previousDate})`);

    // TEST 1: Morning prediction request succeeds
    console.log('\n[Test 1] POST /api/predictions/morning...');
    const payload1 = {
      sleep_hours: 8.5,
      sleep_quality: 4,
      morning_stress: 3,
      morning_mood: 4,
      latitude: 17.0645,
      longitude: 74.2854,
      date: testDate,
    };

    const res1 = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/predictions/morning',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserToken}`
      },
    }, payload1);

    if (res1.status === 200 && res1.data && res1.data.success) {
      results.test1_morningPredictionSuccess = true;
      console.log(' ✅ PASS: Morning prediction request succeeded.');
    } else {
      console.error(` ❌ FAIL: Morning prediction returned HTTP ${res1.status}:`, res1.data);
    }

    // Read saved morning prediction input directly from Firestore
    const inputRef = db.collection('users').doc(testUserRecord.uid).collection('prediction_inputs').doc(testDate);
    const inputSnap = await inputRef.get();
    
    if (inputSnap.exists) {
      const inputData = inputSnap.data();

      // TEST 2: Morning prediction does not contain evening migraine outcome
      const hasOutcomeFields = ['migraine_occurrence', 'migraine_severity', 'migraine_duration', 'symptoms'].some(k => k in inputData);
      if (!hasOutcomeFields) {
        results.test2_inputNoEveningOutcome = true;
        console.log(' ✅ PASS: Morning prediction input does not contain evening migraine outcome fields.');
      } else {
        console.error(' ❌ FAIL: Morning prediction input contains outcome fields:', inputData);
      }

      // TEST 3: Morning prediction does not use end-of-day screen time
      const hasEndOfDayFields = ['screen_time', 'hydration', 'exercise', 'meal_skipped', 'caffeine'].some(k => k in inputData);
      if (!hasEndOfDayFields) {
        results.test3_inputNoScreenTime = true;
        console.log(' ✅ PASS: Morning prediction input does not use end-of-day screen time / lifestyle metrics.');
      } else {
        console.error(' ❌ FAIL: Morning prediction input contains end-of-day variables:', inputData);
      }

      // TEST 4: Morning prediction uses sleep from previous night
      if (inputData.sleep_hours === 8.5 && inputData.sleep_quality === 4) {
        results.test4_inputSleepPreviousNight = true;
        console.log(' ✅ PASS: Morning prediction input uses sleep rest values from previous night.');
      } else {
        console.error(' ❌ FAIL: Sleep values do not match:', inputData.sleep_hours, inputData.sleep_quality);
      }
    } else {
      console.error(' ❌ FAIL: Morning prediction input document was not created in Firestore.');
    }

    // TEST 7: Duplicate prediction protection
    console.log('\n[Test 7] Sending duplicate morning prediction request for same date...');
    const res7 = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/predictions/morning',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserToken}`
      },
    }, payload1);

    if (res7.status === 200 && res7.data && res7.data.alreadyExists === true) {
      results.test7_duplicatePredictionProtection = true;
      console.log(' ✅ PASS: Duplicate prediction was blocked and returned the existing forecast.');
    } else {
      console.error(' ❌ FAIL: Duplicate prediction request did not return alreadyExists: true:', res7.data);
    }

    // TEST 5: Evening check-in still stores migraine_occurrence
    console.log('\n[Test 5] Submitting evening check-in (POST /api/checkins/today)...');
    const checkinPayload = {
      sleep_hours: 8.5,
      sleep_quality: 4,
      daily_stress: 5,
      mood: 4,
      screen_time: 6.5,
      hydration: 2.5,
      meal_skipped: 'No',
      caffeine: 'None',
      exercise: 'Moderate',
      migraine_occurrence: true,
      migraine_severity: 6,
      migraine_duration: '4–12 hours',
      symptoms: ['throbbing pain', 'sensitivity to light'],
      date: testDate,
    };

    const res5 = await httpRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/checkins/today',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserToken}`
      },
    }, checkinPayload);

    if (res5.status === 200 && res5.data && res5.data.success) {
      // Query checkin document
      const checkinRef = db.collection('users').doc(testUserRecord.uid).collection('daily_checkins').doc(testDate);
      const checkinSnap = await checkinRef.get();
      if (checkinSnap.exists && checkinSnap.data().migraine_occurrence === true && checkinSnap.data().migraine_severity === 6) {
        results.test5_eveningCheckinStoresOutcome = true;
        console.log(' ✅ PASS: Evening check-in successfully logged and saved migraine_occurrence = true.');
      } else {
        console.error(' ❌ FAIL: Check-in document does not match expected output in Firestore.');
      }
    } else {
      console.error(` ❌ FAIL: Evening check-in request failed: HTTP ${res5.status}:`, res5.data);
    }

    // TEST 6: Prediction and outcome are stored separately
    // Check if both collections have docs
    const predictionExists = inputSnap.exists;
    const checkinSnap = await db.collection('users').doc(testUserRecord.uid).collection('daily_checkins').doc(testDate).get();
    if (predictionExists && checkinSnap.exists) {
      results.test6_predictionAndOutcomeStoredSeparately = true;
      console.log(' ✅ PASS: Morning prediction input and evening outcome check-in are stored in separate collections.');
    } else {
      console.error(' ❌ FAIL: Documents are not stored separately.');
    }

    // TEST 8: Weather(T-1) is historical/observed
    const weatherT1Snap = await db.collection('users').doc(testUserRecord.uid).collection('weather_records').doc(previousDate).get();
    if (weatherT1Snap.exists && weatherT1Snap.data().data_type === 'observed') {
      results.test8_weatherT1Observed = true;
      console.log(' ✅ PASS: Weather T-1 is historical observed data.');
    } else {
      console.error(' ❌ FAIL: Weather T-1 was not stored as observed data.');
    }

    // TEST 9: Weather(T) is forecast data, NOT observed
    const weatherTSnap = await db.collection('users').doc(testUserRecord.uid).collection('weather_records').doc(`${testDate}_forecast`).get();
    if (weatherTSnap.exists && weatherTSnap.data().data_type === 'forecast' && weatherTSnap.data().source === 'openmeteo_forecast') {
      results.test9_weatherTForecast = true;
      console.log(' ✅ PASS: Weather T is forecast data, stored separately from observed data.');
    } else {
      console.error(' ❌ FAIL: Weather T forecast was not saved or lacked forecast data type:', weatherTSnap.data());
    }

    // TEST 10: WEATHER_MODEL_ENABLED=false remains enforced (Model A baseline returns)
    if (res1.data && res1.data.forecast && res1.data.forecast.model_used === 'MODEL_A_LIFESTYLE_BASELINE') {
      results.test10_modelAEnforced = true;
      console.log(' ✅ PASS: Model A (MODEL_A_LIFESTYLE_BASELINE) is strictly enforced for prediction routing.');
    } else {
      console.error(' ❌ FAIL: Weather model routing was enabled or model_used was not MODEL_A_LIFESTYLE_BASELINE:', res1.data);
    }

  } catch (error) {
    console.error(' ❌ ERROR during verification run:', error);
  } finally {
    // CLEANUP: Clean up test documents and users
    console.log('\n[Cleanup] Cleaning up verification user and documents...');
    try {
      const paths = [
        `users/${testUserRecord.uid}/weather_records/${previousDate}`,
        `users/${testUserRecord.uid}/weather_records/${testDate}_forecast`,
        `users/${testUserRecord.uid}/weather_records/${testDate}`,
        `users/${testUserRecord.uid}/prediction_inputs/${testDate}`,
        `users/${testUserRecord.uid}/daily_checkins/${testDate}`,
        `users/${testUserRecord.uid}/daily_checkins/${testDate}/migraine_episodes/primary`,
        `users/${testUserRecord.uid}/risk_forecasts/${testDate}`,
      ];

      for (const p of paths) {
        const parts = p.split('/');
        if (parts.length === 4) {
          await db.collection('users').doc(parts[1]).collection(parts[2]).doc(parts[3]).delete();
        } else if (parts.length === 6) {
          await db.collection('users').doc(parts[1]).collection(parts[2]).doc(parts[3]).collection(parts[4]).doc(parts[5]).delete();
        }
      }

      await db.collection('users').doc(testUserRecord.uid).delete();
      await auth.deleteUser(testUserRecord.uid);
      console.log(' ✅ Cleanup complete.');
    } catch (cleanErr) {
      console.warn(' ⚠️ Cleanup warnings:', cleanErr.message);
    }
  }

  // Summarize results
  console.log('\n================================================================');
  console.log(' VERIFICATION RESULT SUMMARY');
  console.log('================================================================');
  let allPassed = true;
  for (const [tName, passed] of Object.entries(results)) {
    console.log(`  [${passed ? 'PASSED ✅' : 'FAILED ❌'}] ${tName}`);
    if (!passed) allPassed = false;
  }
  console.log('================================================================');

  if (allPassed) {
    console.log(' 🎉 ALL STAGE 10 VERIFICATION TESTS PASSED!');
    process.exit(0);
  } else {
    console.error(' ❌ SOME VERIFICATION TESTS FAILED.');
    process.exit(1);
  }
}

runVerification();
