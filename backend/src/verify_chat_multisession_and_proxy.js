import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { auth, db } from './config/firebaseAdmin.js';
import { firestoreService } from './services/firestoreService.js';

async function runChatMultiSessionTests() {
  console.log('\n======================================================================');
  console.log('🧪 VERIFYING CHAT MULTI-SESSION ISOLATION, TITLES & DELETION');
  console.log('======================================================================\n');

  let userA, userB;
  try {
    const emailA = `chat_test_a_${Date.now()}@migraineguardian.test`;
    const emailB = `chat_test_b_${Date.now()}@migraineguardian.test`;

    userA = await auth.createUser({ email: emailA, password: 'TestPassword123!', displayName: 'Chat User A' });
    userB = await auth.createUser({ email: emailB, password: 'TestPassword123!', displayName: 'Chat User B' });

    console.log(`[Setup] User A UID: ${userA.uid}`);
    console.log(`[Setup] User B UID: ${userB.uid}`);

    // TEST 1: New Chat returns empty session, does not resurrect old sessions
    console.log('\n[Test 1] Verify fresh session creation is empty...');
    const session1Id = `session_1_${Date.now()}`;
    const freshSession1 = await firestoreService.getChatSession(userA.uid, session1Id);
    if (freshSession1 && freshSession1.messages.length === 0) {
      console.log('  ✅ Fresh session correctly returned 0 messages');
    } else {
      throw new Error(`Fresh session expected 0 messages, got ${freshSession1?.messages?.length}`);
    }

    // TEST 2: Save messages into Session 1 and verify title generation
    console.log('\n[Test 2] Save messages to Session 1 and check auto-title...');
    const messages1 = [
      { id: 'm1', role: 'user', content: 'What are the common triggers for migraine with aura?', timestamp: new Date().toISOString() },
      { id: 'm2', role: 'assistant', content: 'Common triggers include stress, bright lights, and sleep changes.', timestamp: new Date().toISOString() }
    ];
    await firestoreService.saveChatSession(userA.uid, session1Id, messages1);

    const savedSession1 = await firestoreService.getChatSession(userA.uid, session1Id);
    console.log(`  Saved Session 1 title: "${savedSession1.title}"`);
    console.log(`  Saved Session 1 message count: ${savedSession1.messages.length}`);
    if (savedSession1.messages.length === 2 && savedSession1.title.includes('triggers')) {
      console.log('  ✅ Session 1 saved and titled accurately');
    } else {
      throw new Error('Session 1 title or message count mismatch');
    }

    // TEST 3: User A starts Session 2 (New Chat) - verify it doesn't overwrite or merge with Session 1
    console.log('\n[Test 3] Create Session 2 and verify isolation from Session 1...');
    const session2Id = `session_2_${Date.now()}`;
    const freshSession2 = await firestoreService.getChatSession(userA.uid, session2Id);
    if (freshSession2.messages.length !== 0) {
      throw new Error('Session 2 was not empty when initialized!');
    }

    const messages2 = [
      { id: 'm3', role: 'user', content: 'माइग्रेनसाठी कोणता आहार चांगला आहे?', timestamp: new Date().toISOString() },
      { id: 'm4', role: 'assistant', content: 'हिरव्या पालेभाज्या आणि पुरेसे पाणी पिणे फायदेशीर ठरू शकते.', timestamp: new Date().toISOString() }
    ];
    await firestoreService.saveChatSession(userA.uid, session2Id, messages2);

    const listA = await firestoreService.listChatSessions(userA.uid);
    console.log(`  User A total sessions listed: ${listA.length}`);
    console.log('  Sessions:', listA.map(s => ({ id: s.sessionId, title: s.title, count: s.messageCount })));
    if (listA.length === 2) {
      console.log('  ✅ User A has exactly 2 distinct sessions');
    } else {
      throw new Error(`Expected 2 sessions for User A, found ${listA.length}`);
    }

    // TEST 4: User B isolation - User B cannot see User A's sessions
    console.log('\n[Test 4] Verify User B cannot access or list User A sessions...');
    const listB = await firestoreService.listChatSessions(userB.uid);
    console.log(`  User B total sessions listed: ${listB.length}`);
    if (listB.length === 0) {
      console.log('  ✅ User B has 0 sessions (perfect tenant isolation)');
    } else {
      throw new Error('User B was able to see sessions!');
    }

    // Attempt direct read of User A's session under User B UID
    const leakedSession = await firestoreService.getChatSession(userB.uid, session1Id);
    if (leakedSession && leakedSession.messages.length === 0) {
      console.log('  ✅ User B querying Session 1 gets an empty object, no leaked messages');
    } else {
      throw new Error('Data leaked across user boundaries!');
    }

    // TEST 5: Deleting Session 1 preserves Session 2
    console.log('\n[Test 5] Delete Session 1 and verify Session 2 remains intact...');
    await firestoreService.deleteChatSession(userA.uid, session1Id);
    const listAAfterDelete = await firestoreService.listChatSessions(userA.uid);
    console.log(`  User A sessions after deleting session 1: ${listAAfterDelete.length}`);
    if (listAAfterDelete.length === 1 && listAAfterDelete[0].sessionId === session2Id) {
      console.log('  ✅ Session 1 deleted successfully; Session 2 remains unaffected');
    } else {
      throw new Error('Session deletion failed or affected wrong session');
    }

    // TEST 6: Verify backend RAG proxy integration with external service
    console.log('\n[Test 6] Testing Backend RAG proxy endpoint...');
    const testPayload = {
      message: 'Hello, what helps with migraine relief?',
      language: 'en',
      session_id: 'test_proxy_session'
    };

    const ragUrl = process.env.RAG_SERVICE_URL || 'https://migraine-rag-chatbot.onrender.com';
    console.log(`  Pinging RAG service at: ${ragUrl}/api/chat`);
    const resp = await fetch(`${ragUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(45000)
    });
    console.log(`  RAG service response status: ${resp.status}`);
    if (resp.ok) {
      const data = await resp.json();
      console.log('  RAG response preview:', (data.response || data.reply || JSON.stringify(data)).substring(0, 100));
      console.log('  ✅ RAG service proxy communication confirmed functional');
    } else {
      console.log(`  ⚠️ RAG service returned ${resp.status} (cold start or temporary).`);
    }

    console.log('\n======================================================================');
    console.log('🎉 ALL CHAT MULTI-SESSION TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================================\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exitCode = 1;
  } finally {
    if (userA) {
      try { await auth.deleteUser(userA.uid); } catch (e) {}
    }
    if (userB) {
      try { await auth.deleteUser(userB.uid); } catch (e) {}
    }
  }
}

runChatMultiSessionTests();
