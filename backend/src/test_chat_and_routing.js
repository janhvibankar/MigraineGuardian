/**
 * Regression Test: Chat History Persistence & API Route Aliases
 * Tests:
 * 1. Chat persistence methods in firestoreService (save, retrieve, clear)
 * 2. Route aliases without /api prefix (e.g. /pss/questions, /ml-health)
 * 3. Security: Authenticated vs unauthenticated access rejection
 */

import { firestoreService } from './services/firestoreService.js';

async function runRegressionTests() {
  console.log('--- Starting MigraineGuardian Backend Regression Tests ---');
  let passed = 0;
  let failed = 0;

  const testUserId = `test_user_regression_${Date.now()}`;
  const testSessionId = `test_sess_${Date.now()}`;

  // Test 1: Save chat session
  try {
    const testMessages = [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'What is my migraine risk today?',
        time: '10:00 AM',
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        text: 'Your risk is elevated due to 5.2 hours of sleep.',
        sources: ['sleep_triggers.md'],
        time: '10:01 AM',
      },
    ];

    const saveRes = await firestoreService.saveChatSession(testUserId, testSessionId, testMessages);
    if (saveRes.success && saveRes.messages.length === 2) {
      console.log('✓ PASS: firestoreService.saveChatSession');
      passed++;
    } else {
      console.error('✗ FAIL: firestoreService.saveChatSession unexpected result', saveRes);
      failed++;
    }

    // Test 2: Retrieve chat session
    const retrieved = await firestoreService.getChatSession(testUserId, testSessionId);
    if (retrieved && retrieved.messages && retrieved.messages.length === 2) {
      console.log('✓ PASS: firestoreService.getChatSession');
      passed++;
    } else {
      console.error('✗ FAIL: firestoreService.getChatSession unexpected result', retrieved);
      failed++;
    }

    // Test 3: Account isolation (different user cannot see testUser's session)
    const otherUserRes = await firestoreService.getChatSession('other_isolated_user_999', testSessionId);
    if (!otherUserRes || otherUserRes.messages.length === 0) {
      console.log('✓ PASS: Account isolation: User B cannot access User A chat messages');
      passed++;
    } else {
      console.error('✗ FAIL: Account isolation failed!');
      failed++;
    }

    // Test 4: Clear chat session
    const clearRes = await firestoreService.clearChatSession(testUserId, testSessionId);
    const postClear = await firestoreService.getChatSession(testUserId, testSessionId);
    if (clearRes.success && (!postClear || postClear.messages.length === 0)) {
      console.log('✓ PASS: firestoreService.clearChatSession');
      passed++;
    } else {
      console.error('✗ FAIL: firestoreService.clearChatSession unexpected result', postClear);
      failed++;
    }
  } catch (err) {
    console.error('✗ EXCEPTION during chat persistence tests:', err.message);
    failed++;
  }

  // Test 5: HTTP route verification against live local server
  try {
    const healthRes = await fetch('http://localhost:5001/api/health');
    const healthJson = await healthRes.json();
    if (healthRes.ok && healthJson.status === 'OK') {
      console.log('✓ PASS: /api/health returned 200 OK');
      passed++;
    } else {
      console.error('✗ FAIL: /api/health failed');
      failed++;
    }

    const mlHealthRes = await fetch('http://localhost:5001/api/ml-health');
    const mlHealthJson = await mlHealthRes.json();
    if (mlHealthRes.ok && mlHealthJson.status === 'ok' && mlHealthJson.model_loaded === true) {
      console.log('✓ PASS: /api/ml-health returned 200 with model_loaded=true');
      passed++;
    } else {
      console.error('✗ FAIL: /api/ml-health failed');
      failed++;
    }

    // Route alias /pss/questions (no /api prefix)
    const pssAliasRes = await fetch('http://localhost:5001/pss/questions');
    if (pssAliasRes.ok) {
      console.log('✓ PASS: Route alias /pss/questions returned 200');
      passed++;
    } else {
      console.error('✗ FAIL: Route alias /pss/questions failed with status ' + pssAliasRes.status);
      failed++;
    }

    // Auth protection on /api/chat/history
    const chatUnauthRes = await fetch('http://localhost:5001/api/chat/history');
    if (chatUnauthRes.status === 401) {
      console.log('✓ PASS: Protected endpoint /api/chat/history returned 401 Unauthorized without token');
      passed++;
    } else {
      console.error('✗ FAIL: /api/chat/history did not return 401, returned ' + chatUnauthRes.status);
      failed++;
    }
  } catch (err) {
    console.error('✗ EXCEPTION during HTTP route tests:', err.message);
    failed++;
  }

  console.log(`\nRegression Test Summary: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRegressionTests();
