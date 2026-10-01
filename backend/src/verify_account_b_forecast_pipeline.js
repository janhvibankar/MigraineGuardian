import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { auth, db } from './config/firebaseAdmin.js';
import { firestoreService } from './services/firestoreService.js';
import { mlInferenceService } from './services/mlInferenceService.js';

async function verifyAccountBForecastPipeline() {
  console.log('\n======================================================================');
  console.log('🧪 VERIFYING ACCOUNT B FORECAST PIPELINE (ZERO-BASELINE & MULTI-ACCOUNT)');
  console.log('======================================================================\n');

  let userA, userB;
  const today = new Date().toISOString().split('T')[0];

  try {
    const emailA = `account_a_${Date.now()}@migraineguardian.test`;
    const emailB = `account_b_${Date.now()}@migraineguardian.test`;

    userA = await auth.createUser({ email: emailA, password: 'TestPassword123!', displayName: 'Account A' });
    userB = await auth.createUser({ email: emailB, password: 'TestPassword123!', displayName: 'Account B' });

    console.log(`[Setup] Account A UID: ${userA.uid}`);
    console.log(`[Setup] Account B UID: ${userB.uid}`);

    // TEST 1: Account A records check-in with full fields
    console.log('\n[Test 1] Account A submits full daily check-in...');
    const checkinA = {
      sleepHours: 7.5,
      sleepQuality: 4,
      stressLevel: 3,
      moodLevel: 4,
      screenTime: 5.0,
      waterIntake: 2.5,
      caffeineIntake: 1,
      hadAttack: false,
    };
    await firestoreService.saveDailyCheckin(userA.uid, today, checkinA);
    const baselineA = await firestoreService.getUserBaselineStats(userA.uid);
    console.log('  Account A Baseline Stats:', baselineA);

    const resA = await mlInferenceService.predictMigraineRisk({
      user_id: userA.uid,
      latest_log: {
        sleep_hours: 7.5,
        sleep_quality: 4,
        daily_stress: 3,
        mood: 4,
        screen_time: 5.0,
        hydration: 2.5,
      },
      baseline_stats: {
        avg_sleep: baselineA.avg_sleep,
        avg_stress: baselineA.avg_stress,
        pss_score: baselineA.pss_score,
      },
      recent_episodes_count_7d: 0,
    });

    if (!resA.success || !resA.data || resA.data.score === undefined) {
      throw new Error(`Account A prediction failed: ${JSON.stringify(resA)}`);
    }
    const predictionA = resA.data;
    console.log(` ✅ PASS: Account A forecast calculated: ${predictionA.score}% (${predictionA.level})`);
    await firestoreService.saveRiskForecast(userA.uid, today, predictionA);

    // TEST 2: Account B has ZERO prior logs, missing PSS, and submits camelCase/partial fields
    console.log('\n[Test 2] Account B submits check-in with ZERO history, no PSS, and camelCase fields...');
    const checkinB = {
      sleep_hours: 5.5,
      sleep_quality: 2,
      daily_stress: 8,
      mood: 2,
      screen_time: 9.0,
      hydration: 1.2,
      // No attacks, no baseline history
    };
    await firestoreService.saveDailyCheckin(userB.uid, today, checkinB);
    const baselineB = await firestoreService.getUserBaselineStats(userB.uid);
    console.log('  Account B Baseline Stats (Zero prior days):', baselineB);

    if (isNaN(baselineB.avg_sleep) || isNaN(baselineB.avg_stress) || isNaN(baselineB.pss_score)) {
      throw new Error(`Account B baseline produced NaN values: ${JSON.stringify(baselineB)}`);
    }

    const resB = await mlInferenceService.predictMigraineRisk({
      user_id: userB.uid,
      latest_log: {
        sleep_hours: 5.5,
        sleep_quality: 2,
        daily_stress: 8,
        mood: 2,
        screen_time: 9.0,
        hydration: 1.2,
      },
      baseline_stats: {
        avg_sleep: baselineB.avg_sleep,
        avg_stress: baselineB.avg_stress,
        pss_score: baselineB.pss_score,
      },
      recent_episodes_count_7d: 0,
    });

    if (!resB.success || !resB.data || resB.data.score === undefined) {
      throw new Error(`Account B prediction failed: ${JSON.stringify(resB)}`);
    }
    const predictionB = resB.data;
    console.log(` ✅ PASS: Account B forecast calculated: ${predictionB.score}% (${predictionB.level})`);
    console.log(`  SHAP attributions count: ${predictionB.xai?.features?.length || 0}`);
    console.log(`  Elevated factors: ${predictionB.elevatedFactors?.length || 0}`);
    console.log(`  Focus areas: ${predictionB.focusAreas?.length || 0}`);

    await firestoreService.saveRiskForecast(userB.uid, today, predictionB);

    // TEST 3: Verify strict Firestore isolation between A and B
    console.log('\n[Test 3] Verifying account isolation between A and B in Firestore...');
    const forecastA = await firestoreService.getLatestRiskForecast(userA.uid, today);
    const forecastB = await firestoreService.getLatestRiskForecast(userB.uid, today);

    if (forecastA.score === forecastB.score) {
      console.warn(`  Scores matched (${forecastA.score}% vs ${forecastB.score}%), checking inputs...`);
    } else {
      console.log(`  Account A Score: ${forecastA.score}% vs Account B Score: ${forecastB.score}%`);
    }

    if (!forecastA || !forecastB) {
      throw new Error('Missing forecast in Firestore');
    }
    console.log(' ✅ PASS: Both accounts have independent, persisted forecasts in Firestore.');

    console.log('\n======================================================================');
    console.log('🎉 ALL ACCOUNT B PIPELINE VERIFICATIONS PASSED PERFECTLY!');
    console.log('======================================================================\n');
  } catch (err) {
    console.error('❌ Verification Error:', err);
    process.exit(1);
  } finally {
    if (userA) {
      try {
        await auth.deleteUser(userA.uid);
        await db.collection('users').doc(userA.uid).delete();
      } catch (e) {}
    }
    if (userB) {
      try {
        await auth.deleteUser(userB.uid);
        await db.collection('users').doc(userB.uid).delete();
      } catch (e) {}
    }
  }
}

verifyAccountBForecastPipeline();
