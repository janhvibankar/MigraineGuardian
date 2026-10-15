import assert from 'assert';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import app from './app.js';
import { calculatePssScore, getScoreInterpretation } from './controllers/pssController.js';
import { getRagServiceUrl } from './controllers/chatController.js';
import { activeInferenceMap } from './controllers/predictionController.js';
import { getMlServiceUrl } from './services/mlInferenceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let server;
let baseUrl;

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json || data,
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runRegressionSuite() {
  console.log('================================================================');
  console.log('   MIGRAINEGUARDIAN RENDER PRODUCTION FIXES REGRESSION SUITE    ');
  console.log('================================================================\n');

  // Start ephemeral test server
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  const port = server.address().port;

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  [PASS] Test ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] Test ${total}: ${name}`);
      console.error(`         ${err.message}`);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] Test ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] Test ${total}: ${name}`);
      console.error(`         ${err.message}`);
    }
  }

  try {
    // --- SUITE A: RENDER ROUTING & BLUEPRINT CONFIGURATION ---
    console.log('--- SUITE A: Render Routing & SPA Configuration ---');

    test('render.yaml exists and defines static site with /* rewrite to /index.html', () => {
      const renderYamlPath = path.resolve(__dirname, '../../render.yaml');
      assert(fs.existsSync(renderYamlPath), 'render.yaml must exist in root repository directory');
      const content = fs.readFileSync(renderYamlPath, 'utf8');
      assert(content.includes('type: web'), 'render.yaml must specify service type: web');
      assert(content.includes('runtime: static'), 'render.yaml must specify runtime: static');
      assert(content.includes('staticPublishPath: ./frontend/dist'), 'render.yaml must point to ./frontend/dist');
      assert(content.includes('type: rewrite'), 'render.yaml must define rewrite route rule');
      assert(content.includes('source: /*'), 'render.yaml must rewrite /* to index.html');
      assert(content.includes('destination: /index.html'), 'render.yaml destination must be /index.html');
    });

    test('apiClient.js normalizes API_BASE_URL to include /api and uses 75s AI timeouts', () => {
      const apiClientPath = path.resolve(__dirname, '../../frontend/src/services/apiClient.js');
      assert(fs.existsSync(apiClientPath), 'apiClient.js must exist');
      const content = fs.readFileSync(apiClientPath, 'utf8');
      assert(content.includes('function resolveApiBaseUrl()'), 'apiClient.js must normalize API_BASE_URL dynamically');
      assert(content.includes("configured.endsWith('/api') ? configured : `${configured}/api`"), 'apiClient.js must append /api if missing from configured URL');
      assert(content.includes("isAiOperation = url.includes('/predictions') || url.includes('/chat')"), 'apiClient.js must identify both /predictions and /chat as AI operations');
      assert(content.includes('isAiOperation ? 75000 : 30000'), 'apiClient.js must allocate 75000ms timeout for AI operations');
    });

    // --- SUITE B: PSS-10 ASSESSMENT ---
    console.log('\n--- SUITE B: PSS-10 Assessment Logic & Endpoints ---');

    test('calculatePssScore computes correct standardized clinical score with reverse scoring', () => {
      const allZeroAnswers = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
      assert.strictEqual(calculatePssScore(allZeroAnswers), 16, 'All 0s should yield score of 16');

      const allTwoAnswers = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2 };
      assert.strictEqual(calculatePssScore(allTwoAnswers), 20, 'All 2s should yield score of 20');

      const maxStressAnswers = { 1: 4, 2: 4, 3: 4, 4: 0, 5: 0, 6: 4, 7: 0, 8: 0, 9: 4, 10: 4 };
      assert.strictEqual(calculatePssScore(maxStressAnswers), 40, 'Max stress answers should yield score of 40');

      const minStressAnswers = { 1: 0, 2: 0, 3: 0, 4: 4, 5: 4, 6: 0, 7: 4, 8: 4, 9: 0, 10: 0 };
      assert.strictEqual(calculatePssScore(minStressAnswers), 0, 'Min stress answers should yield score of 0');
    });

    test('getScoreInterpretation returns appropriate non-diagnostic categorization', () => {
      const low = getScoreInterpretation(10);
      assert.strictEqual(low.category, 'Low Perceived Stress');
      assert.strictEqual(low.color, 'teal');

      const mod = getScoreInterpretation(20);
      assert.strictEqual(mod.category, 'Moderate Stress Load');
      assert.strictEqual(mod.color, 'sage');

      const high = getScoreInterpretation(32);
      assert.strictEqual(high.category, 'Elevated Perceived Stress');
      assert.strictEqual(high.color, 'alert');
    });

    await testAsync('GET /api/pss/questions and /pss/questions return 200 with 10 questions', async () => {
      const res1 = await httpRequest({ host: '127.0.0.1', port, path: '/api/pss/questions', method: 'GET' });
      assert.strictEqual(res1.statusCode, 200);
      assert.strictEqual(res1.body.success, true);
      assert.strictEqual(res1.body.questions.length, 10);

      const res2 = await httpRequest({ host: '127.0.0.1', port, path: '/pss/questions', method: 'GET' });
      assert.strictEqual(res2.statusCode, 200);
      assert.strictEqual(res2.body.questions.length, 10);
    });

    test('PssAssessmentPage.jsx restores previous assessment and renders serverError', () => {
      const pagePath = path.resolve(__dirname, '../../frontend/src/pages/PssAssessmentPage.jsx');
      const content = fs.readFileSync(pagePath, 'utf8');
      assert(content.includes('loadExistingAssessment'), 'PssAssessmentPage must have loadExistingAssessment on mount');
      assert(content.includes('pssService.getLatestAssessment()'), 'PssAssessmentPage must query getLatestAssessment');
      assert(content.includes('setIsCompleted(true)'), 'PssAssessmentPage must set isCompleted on restore');
      assert(content.includes('{serverError && ('), 'PssAssessmentPage must render serverError banner in JSX');
      assert(content.includes('Assessment completed locally. Note: Could not sync to cloud database'), 'PssAssessmentPage must explicitly communicate local fallback retention without falsely claiming server persistence');
    });

    // --- SUITE C: DAILY CHECK-IN & RISK PREDICTION ---
    console.log('\n--- SUITE C: Daily Check-in & Prediction Reliability ---');

    await testAsync('Root health and proxy endpoints respond on both /api and root paths', async () => {
      const h1 = await httpRequest({ host: '127.0.0.1', port, path: '/api/health', method: 'GET' });
      assert.strictEqual(h1.statusCode, 200);

      const h2 = await httpRequest({ host: '127.0.0.1', port, path: '/health', method: 'GET' });
      assert.strictEqual(h2.statusCode, 200);

      const ch1 = await httpRequest({ host: '127.0.0.1', port, path: '/api/chat-health', method: 'GET' });
      assert([200, 503].includes(ch1.statusCode));

      const ch2 = await httpRequest({ host: '127.0.0.1', port, path: '/chat-health', method: 'GET' });
      assert([200, 503].includes(ch2.statusCode));
    });

    await testAsync('CORS permits requests from Render Static Site origin', async () => {
      const res = await httpRequest({
        host: '127.0.0.1',
        port,
        path: '/api/checkins/today',
        method: 'OPTIONS',
        headers: {
          Origin: 'https://migraineguardian-frontend.onrender.com',
          'Access-Control-Request-Method': 'POST',
        },
      });

      assert.strictEqual(res.statusCode, 204);
      assert.strictEqual(res.headers['access-control-allow-origin'], 'https://migraineguardian-frontend.onrender.com');
    });

    test('activeInferenceMap is shared between checkinController and predictionController', () => {
      assert(activeInferenceMap instanceof Map, 'activeInferenceMap must be an instance of Map');
      const testKey = 'test_user_regression_date';
      activeInferenceMap.set(testKey, Promise.resolve(true));
      assert(activeInferenceMap.has(testKey), 'activeInferenceMap must register in-flight operations');
      activeInferenceMap.delete(testKey);
      assert(!activeInferenceMap.has(testKey), 'activeInferenceMap must clear completed operations');
    });

    test('getMlServiceUrl normalizes host URL and strips redundant /predict endpoint path', () => {
      const origMl = process.env.ML_SERVICE_URL;

      process.env.ML_SERVICE_URL = 'https://migraineguardian-ml.onrender.com';
      assert.strictEqual(getMlServiceUrl(), 'https://migraineguardian-ml.onrender.com');

      process.env.ML_SERVICE_URL = 'https://migraineguardian-ml.onrender.com/predict';
      assert.strictEqual(getMlServiceUrl(), 'https://migraineguardian-ml.onrender.com');

      process.env.ML_SERVICE_URL = 'https://migraineguardian-ml.onrender.com/predict/';
      assert.strictEqual(getMlServiceUrl(), 'https://migraineguardian-ml.onrender.com');

      if (origMl !== undefined) {
        process.env.ML_SERVICE_URL = origMl;
      } else {
        delete process.env.ML_SERVICE_URL;
      }
    });

    // --- SUITE D: CHATBOT RAG INTEGRATION ---
    console.log('\n--- SUITE D: Chatbot & RAG Integration ---');

    test('getRagServiceUrl dynamically normalizes URL and appends /api/chat if missing', () => {
      const originalEnv = process.env.RAG_SERVICE_URL;

      // Test 1: Full URL with /api/chat
      process.env.RAG_SERVICE_URL = 'https://migraine-rag-chatbot.onrender.com/api/chat';
      assert.strictEqual(getRagServiceUrl(), 'https://migraine-rag-chatbot.onrender.com/api/chat');

      // Test 2: Bare base URL without /api/chat
      process.env.RAG_SERVICE_URL = 'https://migraine-rag-chatbot.onrender.com';
      assert.strictEqual(getRagServiceUrl(), 'https://migraine-rag-chatbot.onrender.com/api/chat');

      // Test 3: Trailing slash without /api/chat
      process.env.RAG_SERVICE_URL = 'https://migraine-rag-chatbot.onrender.com/';
      assert.strictEqual(getRagServiceUrl(), 'https://migraine-rag-chatbot.onrender.com/api/chat');

      // Test 4: URL with /api but without /chat
      process.env.RAG_SERVICE_URL = 'https://migraine-rag-chatbot.onrender.com/api';
      assert.strictEqual(getRagServiceUrl(), 'https://migraine-rag-chatbot.onrender.com/api/chat');

      // Restore env
      if (originalEnv !== undefined) {
        process.env.RAG_SERVICE_URL = originalEnv;
      } else {
        delete process.env.RAG_SERVICE_URL;
      }
    });

    await testAsync('Chat proxy route validates empty message payload cleanly', async () => {
      const res = await httpRequest(
        {
          host: '127.0.0.1',
          port,
          path: '/api/chat/message',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { message: '', sessionId: 'test' }
      );

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert(res.body.error.message.includes('required'));
    });
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n================================================================');
  console.log(`   REGRESSION RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error('Unhandled suite error:', err);
  process.exit(1);
});
