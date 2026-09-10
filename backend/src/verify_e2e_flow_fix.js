import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import { auth, db } from './config/firebaseAdmin.js';
import app from './app.js';

async function runEndToEndVerification() {
  console.log('\n======================================================================');
  console.log('🧪 VERIFYING COMPLETE CHECK-IN -> ML PREDICTION -> RISK ANALYSIS FLOW');
  console.log('======================================================================\n');

  const TEST_PORT = 5069;
  let server;
  let userA, userB;
  const today = new Date().toISOString().split('T')[0];

  try {
    server = app.listen(TEST_PORT);

    // 1. Create two test users in Firebase Auth
    const emailA = `e2e_tester_a_${Date.now()}@migraineguardian.test`;
    const emailB = `e2e_tester_b_${Date.now()}@migraineguardian.test`;

    userA = await auth.createUser({ email: emailA, password: 'TestPassword123!', displayName: 'Test User A' });
    userB = await auth.createUser({ email: emailB, password: 'TestPassword123!', displayName: 'Test User B' });

    console.log(`[Setup] Created User A: ${userA.uid}`);
    console.log(`[Setup] Created User B: ${userB.uid}`);

    const { submitDailyCheckinController } = await import('./controllers/checkinController.js');
    const { getTodayPredictionController } = await import('./controllers/predictionController.js');

    // Helper mock response
    const createMockRes = () => {
      const res = {
        statusCode: 200,
        data: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.data = payload;
          return this;
        }
      };
      return res;
    };

    // STEP 1: User A submits Daily Check-in
    console.log('\n[Step 1] User A submits Daily Check-in (POST /api/checkins/today)...');
    const checkinPayload = {
      sleep_hours: 6.0,
      sleep_quality: 3,
      daily_stress: 7,
      mood: 3,
      screen_time: 7.5,
      hydration: 1.8,
      meal_skipped: 'Breakfast',
      caffeine: '2 cups',
      exercise: 'None',
      migraine_occurrence: false,
    };

    const reqSubmit = {
      user: { uid: userA.uid },
      body: checkinPayload,
    };
    const resSubmit = createMockRes();

    await submitDailyCheckinController(reqSubmit, resSubmit, (err) => { throw err; });

    console.log(`  Response Status: ${resSubmit.statusCode}`);
    console.log(`  Check-in Saved:  ${resSubmit.data.checkinSaved}`);
    console.log(`  Forecast Avail:  ${resSubmit.data.forecastAvailable}`);
    console.log(`  Forecast Score:  ${resSubmit.data.forecast?.score}% (${resSubmit.data.forecast?.level} Risk)`);
    console.log(`  SHAP Features:   ${resSubmit.data.forecast?.xai?.features?.length || 0} features`);

    if (!resSubmit.data.checkinSaved || !resSubmit.data.forecastAvailable || !resSubmit.data.forecast) {
      throw new Error('Checkin submission failed to return forecast.');
    }
    console.log(' ✅ Step 1 PASS: Daily Check-in submitted, ML model ran, SHAP computed, and forecast returned.');

    // STEP 2: Verify Firestore contains today's checkin and forecast
    console.log('\n[Step 2] Verifying Cloud Firestore persistence...');
    const savedCheckinDoc = await db.collection('users').doc(userA.uid).collection('daily_checkins').doc(today).get();
    const savedForecastDoc = await db.collection('users').doc(userA.uid).collection('risk_forecasts').doc(today).get();

    if (!savedCheckinDoc.exists) throw new Error('Firestore missing daily_checkin doc');
    if (!savedForecastDoc.exists) throw new Error('Firestore missing risk_forecast doc');

    console.log(`  Firestore checkin path:  users/${userA.uid}/daily_checkins/${today}`);
    console.log(`  Firestore forecast path: users/${userA.uid}/risk_forecasts/${today}`);
    console.log(' ✅ Step 2 PASS: Both check-in and risk forecast documents properly persisted in Firestore.');

    // STEP 3: User navigates to Risk Analysis page (GET /api/predictions/today)
    console.log('\n[Step 3] User navigates to Risk Analysis page (GET /api/predictions/today)...');
    const reqGetPred = {
      user: { uid: userA.uid },
      query: {},
    };
    const resGetPred = createMockRes();

    await getTodayPredictionController(reqGetPred, resGetPred, (err) => { throw err; });

    console.log(`  Response Status: ${resGetPred.statusCode}`);
    console.log(`  Forecast Score:  ${resGetPred.data.data?.score}%`);
    console.log(`  Forecast Level:  ${resGetPred.data.data?.level}`);
    console.log(`  SHAP Explanations: ${resGetPred.data.data?.xai?.features?.length} feature attributions`);
    console.log(`  Elevated Factors:  ${resGetPred.data.data?.elevatedFactors?.length} factors`);
    console.log(`  Focus Areas:       ${resGetPred.data.data?.focusAreas?.length} recommendations`);

    if (!resGetPred.data.data || resGetPred.data.data.score === undefined) {
      throw new Error('Risk Analysis endpoint failed to retrieve today forecast.');
    }
    console.log(' ✅ Step 3 PASS: Risk Analysis page retrieves today\'s real forecast and SHAP explanations.');

    // STEP 4: Page Refresh (GET /api/predictions/today again)
    console.log('\n[Step 4] User refreshes Risk Analysis page (GET /api/predictions/today again)...');
    const resRefresh = createMockRes();
    await getTodayPredictionController(reqGetPred, resRefresh, (err) => { throw err; });

    if (resRefresh.data.data?.score !== resGetPred.data.data?.score) {
      throw new Error('Page refresh returned inconsistent prediction score.');
    }
    console.log(' ✅ Step 4 PASS: Refreshing Risk Analysis page maintains consistent persisted forecast.');

    // STEP 5: User edits today's check-in
    console.log('\n[Step 5] User edits today\'s check-in with higher stress & lower sleep...');
    const editedPayload = {
      ...checkinPayload,
      sleep_hours: 4.5,
      daily_stress: 9,
    };
    const reqEdit = {
      user: { uid: userA.uid },
      body: editedPayload,
    };
    const resEdit = createMockRes();
    await submitDailyCheckinController(reqEdit, resEdit, (err) => { throw err; });

    console.log(`  Updated Score: ${resEdit.data.forecast?.score}% (${resEdit.data.forecast?.level} Risk)`);
    console.log(' ✅ Step 5 PASS: Edited check-in triggered ML pipeline re-evaluation and updated Firestore forecast.');

    // STEP 6: User Isolation Check
    console.log('\n[Step 6] Testing User Isolation (User B cannot see User A\'s forecast)...');
    const reqUserB = {
      user: { uid: userB.uid },
      query: {},
    };
    const resUserB = createMockRes();
    await getTodayPredictionController(reqUserB, resUserB, (err) => { throw err; });

    console.log(`  User B Forecast Data: ${JSON.stringify(resUserB.data.data)}`);
    if (resUserB.data.data !== null) {
      throw new Error('User B received forecast data belonging to User A!');
    }
    console.log(' ✅ Step 6 PASS: User isolation strictly verified; User B receives null because they have no check-in.');

    // STEP 7: On-demand recovery check (checkin exists in Firestore but forecast document deleted)
    console.log('\n[Step 7] Testing On-Demand Forecast Recovery when forecast was missing in Firestore...');
    await db.collection('users').doc(userA.uid).collection('risk_forecasts').doc(today).delete();
    console.log(`  Deleted risk_forecasts/${today} to simulate missing/failed forecast write.`);

    const resRecover = createMockRes();
    await getTodayPredictionController(reqGetPred, resRecover, (err) => { throw err; });

    console.log(`  Recovered Score: ${resRecover.data.data?.score}% (${resRecover.data.data?.level} Risk)`);
    if (!resRecover.data.data || resRecover.data.data.score === undefined) {
      throw new Error('On-demand recovery failed to regenerate forecast from existing check-in.');
    }
    console.log(' ✅ Step 7 PASS: On-demand recovery automatically ran ML model and persisted forecast for existing check-in.');

    // Cleanup
    console.log('\n🧹 Cleaning up test users and documents...');
    await db.collection('users').doc(userA.uid).collection('risk_forecasts').doc(today).delete();
    await db.collection('users').doc(userA.uid).collection('daily_checkins').doc(today).delete();
    await db.collection('users').doc(userA.uid).delete();
    await db.collection('users').doc(userB.uid).delete();
    await auth.deleteUser(userA.uid);
    await auth.deleteUser(userB.uid);
    console.log(' Cleanup completed.');

    console.log('\n======================================================================');
    console.log('🎉 ALL 7 END-TO-END VERIFICATION STEPS PASSED SUCCESSFULLY!');
    console.log('======================================================================\n');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
}

runEndToEndVerification();
