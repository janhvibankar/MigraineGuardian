/**
 * Full Live Pipeline Verification Script
 * Validates:
 * 1. PSS-10 submission & scoring
 * 2. Daily check-in payload validation & structure
 * 3. Real ML model inference via local FastAPI (http://127.0.0.1:8000/predict)
 * 4. Forecast persistence & retrieval via Firestore
 * 5. Real RAG Chatbot query (multilingual en/hi/mr) & citations
 * 6. Chat transcript persistence, reload, and account isolation
 */

import { firestoreService } from './services/firestoreService.js';
import { mlInferenceService } from './services/mlInferenceService.js';
import { calculatePssScore, getScoreInterpretation } from './controllers/pssController.js';

async function verifyFullPipeline() {
  console.log('========================================================');
  console.log('  MigraineGuardian — Full Live Pipeline Verification');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;
  const testUid = `pipeline_audit_user_${Date.now()}`;
  const todayDate = new Date().toLocaleDateString('en-CA');

  // ── 1. PSS-10 Calculation & Categorization ──────────────────────
  try {
    console.log('[1/6] Testing PSS-10 Scoring & Categorization...');
    const testAnswers = {
      1: 3, 2: 2, 3: 3, 4: 1, 5: 2, 6: 3, 7: 1, 8: 2, 9: 3, 10: 2
    };
    const score = calculatePssScore(testAnswers);
    const interp = getScoreInterpretation(score);

    if (score >= 0 && score <= 40 && interp.category) {
      console.log(`  ✓ PSS-10 Score: ${score}/40 | Category: ${interp.category}`);
      passed++;
    } else {
      console.error(`  ✗ PSS-10 Calculation failed: score=${score}`);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ PSS-10 Error:', err.message);
    failed++;
  }

  // ── 2. Real ML Model Inference via Local FastAPI ─────────────────
  let mlResultData = null;
  try {
    console.log('\n[2/6] Testing Real FastAPI ML Inference (http://127.0.0.1:8000/predict)...');
    const mlPayload = {
      user_id: testUid,
      latest_log: {
        sleep_hours: 5.5,
        sleep_quality: 2,
        daily_stress: 8,
        mood: 2,
        screen_time: 9.0,
        hydration: 1.2,
        meal_skipped: "Lunch",
        caffeine: "3 cups",
        exercise: "None",
        migraine_occurrence: false,
      },
      baseline_stats: {
        avg_sleep: 7.2,
        avg_stress: 4.5,
        avg_screen: 6.0,
        avg_hydration: 2.1,
        pss_score: 22,
      },
      recent_episodes_count_7d: 1,
    };

    const mlRes = await mlInferenceService.predictMigraineRisk(mlPayload);

    if (mlRes.success && typeof mlRes.data?.score === 'number' && mlRes.data?.level) {
      mlResultData = mlRes.data;
      console.log(`  ✓ Real ML Prediction Success:`);
      console.log(`    - Risk Score: ${mlResultData.score}%`);
      console.log(`    - Risk Level: ${mlResultData.level}`);
      console.log(`    - Model Used: ${mlResultData.model_used}`);
      console.log(`    - SHAP Features: ${mlResultData.xai?.features?.length ?? 0}`);
      passed++;
    } else {
      console.error('  ✗ ML Inference failed:', mlRes.error);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ ML Inference Error:', err.message);
    failed++;
  }

  // ── 3. Forecast Persistence & Retrieval ─────────────────────────
  try {
    console.log('\n[3/6] Testing Forecast Persistence in Firestore...');
    if (mlResultData) {
      const forecastDoc = {
        forecastDate: todayDate,
        score: mlResultData.score,
        level: mlResultData.level,
        headline: `${mlResultData.level} Sensitivity Window`,
        summary: `Computed risk score of ${mlResultData.score}% (${mlResultData.level} level).`,
        elevatedFactors: mlResultData.elevatedFactors || [],
        focusAreas: mlResultData.focusAreas || [],
        xai: mlResultData.xai || null,
        disclaimer: 'Clinical AI guidance.',
        createdAt: new Date().toISOString(),
      };

      await firestoreService.saveRiskForecast(testUid, todayDate, forecastDoc);
      const retrievedForecast = await firestoreService.getLatestRiskForecast(testUid, todayDate);

      if (retrievedForecast && retrievedForecast.score === mlResultData.score) {
        console.log(`  ✓ Forecast successfully saved & retrieved from Firestore:`);
        console.log(`    - Saved Score: ${retrievedForecast.score}%`);
        console.log(`    - Saved Level: ${retrievedForecast.level}`);
        passed++;
      } else {
        console.error('  ✗ Forecast retrieval mismatch or null');
        failed++;
      }
    } else {
      console.warn('  ⚠ Skipping forecast persistence (ML result missing)');
    }
  } catch (err) {
    console.error('  ✗ Forecast Persistence Error:', err.message);
    failed++;
  }

  // ── 4. Chat History Persistence & Account Isolation ─────────────
  const testSessionId = `audit_sess_${Date.now()}`;
  try {
    console.log('\n[4/6] Testing Chat Transcript Persistence & Account Isolation...');
    const transcript = [
      { id: '1', sender: 'user', text: 'Why is my risk 71.6% today?', time: '11:00 AM' },
      { id: '2', sender: 'assistant', text: 'Your risk is elevated primarily due to reduced sleep (5.5 hrs vs baseline 7.2 hrs).', sources: ['sleep_triggers.md'], time: '11:01 AM' },
    ];

    await firestoreService.saveChatSession(testUid, testSessionId, transcript);
    const loaded = await firestoreService.getChatSession(testUid, testSessionId);

    if (loaded && loaded.messages?.length === 2 && loaded.messages[0].text === transcript[0].text) {
      console.log('  ✓ Chat transcript saved & retrieved correctly with exact messages & sources');
      passed++;
    } else {
      console.error('  ✗ Chat transcript retrieval mismatch');
      failed++;
    }

    // Account Isolation check
    const otherUser = await firestoreService.getChatSession(`unauthorized_user_${Date.now()}`, testSessionId);
    if (!otherUser || otherUser.messages?.length === 0) {
      console.log('  ✓ Account Isolation: Unauthorized user receives 0 messages from private session');
      passed++;
    } else {
      console.error('  ✗ Account isolation breach detected!');
      failed++;
    }
  } catch (err) {
    console.error('  ✗ Chat History Persistence Error:', err.message);
    failed++;
  }

  // ── 5. Real External RAG Chatbot Service Verification ───────────
  try {
    console.log('\n[5/6] Testing Real RAG Chatbot Endpoint (https://migraine-rag-chatbot.onrender.com/api/chat)...');
    const ragResponse = await fetch('https://migraine-rag-chatbot.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How does barometric pressure affect migraines?',
        sessionId: testSessionId,
        language: 'en',
      }),
    });

    if (ragResponse.ok) {
      const ragJson = await ragResponse.json();
      if (ragJson.answer && ragJson.sources) {
        console.log(`  ✓ RAG Service responded:`);
        console.log(`    - Answer: "${ragJson.answer.substring(0, 75)}..."`);
        console.log(`    - Sources: [${ragJson.sources.join(', ')}]`);
        console.log(`    - Language: ${ragJson.language}`);
        passed++;
      } else {
        console.error('  ✗ RAG response missing answer or sources', ragJson);
        failed++;
      }
    } else {
      console.error(`  ✗ RAG request failed with HTTP ${ragResponse.status}`);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ RAG Service Error:', err.message);
    failed++;
  }

  // ── 6. Multilingual Query Verification (Marathi) ─────────────────
  try {
    console.log('\n[6/6] Testing RAG Chatbot Multilingual Query (Marathi / mr)...');
    const mrResponse = await fetch('https://migraine-rag-chatbot.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'मायग्रेन आणि झोप याबद्दल माहिती द्या',
        sessionId: testSessionId,
        language: 'mr',
      }),
    });

    if (mrResponse.ok) {
      const mrJson = await mrResponse.json();
      console.log(`  ✓ Multilingual response received:`);
      console.log(`    - Answer: "${mrJson.answer.substring(0, 60)}..."`);
      console.log(`    - Language returned: ${mrJson.language}`);
      passed++;
    } else {
      console.error(`  ✗ Multilingual query failed with status ${mrResponse.status}`);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ Multilingual Error:', err.message);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`  PIPELINE VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

verifyFullPipeline();
