import assert from 'assert';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import app from './app.js';
import { calculatePssScore, getScoreInterpretation } from './controllers/pssController.js';
import { getRagServiceUrl } from './controllers/chatController.js';
import { activeInferenceMap } from './controllers/predictionController.js';
import { getMlServiceUrl, mlInferenceService } from './services/mlInferenceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

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

    // --- SUITE E: COLD-START RECOVERY, DEADLINE EXHAUSTION & CHECKIN RESILIENCE ---
    console.log('\n--- SUITE E: Cold-Start Recovery & Check-in Resilience ---');

    await testAsync('mlInferenceService recovers from cold-start 502/503 responses and returns prediction', async () => {
      let attempts = 0;
      const mockServer = http.createServer((req, res) => {
        attempts++;
        if (attempts <= 2) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Bad Gateway - Container starting' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ score: 72.5, level: 'High' }));
        }
      });

      await new Promise((resolve) => mockServer.listen(0, resolve));
      const mockPort = mockServer.address().port;
      const mockUrl = `http://127.0.0.1:${mockPort}`;

      try {
        const dummyPayload = {
          user_id: 'test_recovery_user',
          latest_log: { sleep_hours: 6.5, sleep_quality: 3, daily_stress: 5, mood: 3, screen_time: 4, hydration: 2 },
          recent_episodes_count_7d: 0,
        };

        const result = await mlInferenceService.predictMigraineRisk(dummyPayload, mockUrl);
        assert.strictEqual(result.success, true, 'Result should succeed after recovery');
        assert.strictEqual(result.data.score, 72.5, 'Score should match recovered response');
        assert.strictEqual(attempts, 3, 'Should have made 3 attempts (2 failures + 1 recovery)');
      } finally {
        mockServer.close();
      }
    });

    await testAsync('mlInferenceService respects total deadline on persistent 502 and returns FASTAPI_SERVICE_WARMING', async () => {
      const mockServer = http.createServer((req, res) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Bad Gateway - Container starting' }));
      });

      await new Promise((resolve) => mockServer.listen(0, resolve));
      const mockPort = mockServer.address().port;
      const mockUrl = `http://127.0.0.1:${mockPort}`;

      try {
        const dummyPayload = {
          user_id: 'test_deadline_user',
          latest_log: { sleep_hours: 6.5, sleep_quality: 3, daily_stress: 5, mood: 3, screen_time: 4, hydration: 2 },
          recent_episodes_count_7d: 0,
        };

        const t0 = Date.now();
        const result = await mlInferenceService.predictMigraineRisk(dummyPayload, mockUrl, { deadlineMs: 2500 });
        const elapsed = Date.now() - t0;

        assert.strictEqual(result.success, false, 'Should fail gracefully when deadline exceeded');
        assert.strictEqual(result.transient, true, 'Should mark result as transient');
        assert.strictEqual(result.error.code, 'FASTAPI_SERVICE_WARMING', 'Error code should be FASTAPI_SERVICE_WARMING');
        assert(elapsed <= 4000, `Elapsed time (${elapsed}ms) should respect deadline budget`);
      } finally {
        mockServer.close();
      }
    });

    await testAsync('mlInferenceService fails immediately on non-retryable 422 client error without retries', async () => {
      let attempts = 0;
      const mockServer = http.createServer((req, res) => {
        attempts++;
        res.writeHead(422, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Unprocessable Entity - invalid input' }));
      });

      await new Promise((resolve) => mockServer.listen(0, resolve));
      const mockPort = mockServer.address().port;
      const mockUrl = `http://127.0.0.1:${mockPort}`;

      try {
        const dummyPayload = {
          user_id: 'test_422_user',
          latest_log: { sleep_hours: 6.5, sleep_quality: 3, daily_stress: 5, mood: 3, screen_time: 4, hydration: 2 },
          recent_episodes_count_7d: 0,
        };

        const result = await mlInferenceService.predictMigraineRisk(dummyPayload, mockUrl);
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.status, 422);
        assert.strictEqual(attempts, 1, 'Non-retryable 422 must not be retried');
      } finally {
        mockServer.close();
      }
    });

    test('apiClient.js allocates 75s timeout for /checkins alongside /predictions and /chat', () => {
      const apiClientPath = path.resolve(__dirname, '../../frontend/src/services/apiClient.js');
      const content = fs.readFileSync(apiClientPath, 'utf8');
      assert(content.includes("url.includes('/checkins')"), 'apiClient.js must include /checkins in longer timeout classification');
      assert(content.includes('isAiOperation ? 75000 : 30000'), 'apiClient.js must allocate 75000ms for isAiOperation');
    });

    test('checkinController persists to Firestore first and returns immediately with forecastPending: true', () => {
      const checkinControllerPath = path.resolve(__dirname, './controllers/checkinController.js');
      const content = fs.readFileSync(checkinControllerPath, 'utf8');
      assert(content.includes('checkinSaved: true'), 'checkinController must confirm checkinSaved: true');
      assert(content.includes('canRetryForecast: true'), 'checkinController must provide canRetryForecast: true');
      assert(content.includes('forecastPending: true'), 'checkinController must provide forecastPending: true');
      assert(content.includes('forecastAvailable: false'), 'checkinController must specify forecastAvailable: false on immediate response');
      assert(content.includes('activeInferenceMap.set(lockKey, asyncPipelinePromise)'), 'checkinController must trigger async prediction in background');
    });

    test('DailyCheckinPage.jsx prevents duplicate submission and navigates immediately upon save', () => {
      const pagePath = path.resolve(__dirname, '../../frontend/src/pages/DailyCheckinPage.jsx');
      const content = fs.readFileSync(pagePath, 'utf8');
      assert(content.includes('if (isSubmitting) return;'), 'DailyCheckinPage must prevent duplicate submissions');
      assert(content.includes('setIsSubmitting(true)'), 'DailyCheckinPage must set isSubmitting state');
      assert(content.includes('navigate(ROUTES.RISK_ANALYSIS)'), 'DailyCheckinPage must navigate to risk analysis on save');
      assert(content.includes('storageService.removeItem'), 'DailyCheckinPage must clean draft storage on success');
      assert(content.includes('setServerError(errMsg)'), 'DailyCheckinPage must report error and not claim success if save fails');
    });

    test('RiskAnalysisPage.jsx decouples check-in loading from prediction evaluation and displays states', () => {
      const pagePath = path.resolve(__dirname, '../../frontend/src/pages/RiskAnalysisPage.jsx');
      const content = fs.readFileSync(pagePath, 'utf8');
      assert(content.includes('initialCheckinLoading'), 'RiskAnalysisPage must track initialCheckinLoading separately');
      assert(content.includes('isEvaluating'), 'RiskAnalysisPage must track isEvaluating state');
      assert(content.includes('evaluatePrediction'), 'RiskAnalysisPage must run evaluatePrediction asynchronously');
      assert(content.includes('inFlightRef'), 'RiskAnalysisPage must prevent concurrent duplicate prediction evaluations');
      assert(content.includes('checkinRecordedTitle'), 'RiskAnalysisPage must render recorded checkin status banner');
      assert(content.includes('evaluatePrediction(true)'), 'RiskAnalysisPage must provide working manual retry action');
    });

    test('predictionController enforces 50s bounded deadline and strict user/date validation', () => {
      const controllerPath = path.resolve(__dirname, './controllers/predictionController.js');
      const content = fs.readFileSync(controllerPath, 'utf8');
      assert(content.includes('deadlineMs: 50000'), 'predictionController must bound on-demand ML deadline to 50000ms');
      assert(content.includes('forecastDateMatches'), 'predictionController must verify forecastDate matches targetDate');
      assert(content.includes('forecastScoreValid'), 'predictionController must verify forecast score is a valid number');
      assert(content.includes("forecastStatus: 'ready'"), 'predictionController must return forecastStatus: ready when valid');
      assert(content.includes("forecastStatus: isWarming ? 'warming' : 'error'"), 'predictionController must return accurate forecastStatus');
    });

    test('predictionService.js validates targetDate and numeric score, rejecting stale cross-date forecasts', () => {
      const servicePath = path.resolve(__dirname, '../../frontend/src/services/predictionService.js');
      const content = fs.readFileSync(servicePath, 'utf8');
      assert(content.includes('forecastDate === dateQuery'), 'predictionService must check forecastDate against dateQuery');
      assert(content.includes("typeof res.data.score === 'number'"), 'predictionService must verify numeric score');
      assert(content.includes('forecastStatus: res.raw.forecastStatus'), 'predictionService must pass forecastStatus to caller');
      assert(content.includes('storageService.removeItem'), 'predictionService must evict stale or invalid cached forecasts');
    });

    test('FastAPI ML service defines /live and /ready endpoints and instruments startup and inference durations', () => {
      const mainPath = path.resolve(__dirname, '../../ml-service/app/main.py');
      const predictPath = path.resolve(__dirname, '../../ml-service/app/api/predict.py');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      const predictContent = fs.readFileSync(predictPath, 'utf8');

      assert(mainContent.includes('@app.get("/live")'), 'ml-service main.py must define /live endpoint');
      assert(mainContent.includes('@app.get("/ready")'), 'ml-service main.py must define /ready endpoint');
      assert(mainContent.includes('Model loading completed in'), 'ml-service main.py must log model loading duration');
      assert(predictContent.includes('Risk calculation complete in'), 'ml-service predict.py must log inference duration');
    });

    // --- SUITE F: PRODUCTION CORS PREFLIGHT & ORIGIN SECURITY ---
    console.log('\n--- SUITE F: Production CORS Preflight & Origin Security ---');

    await testAsync('OPTIONS preflight from production frontend origin allows Cache-Control, Pragma, and Authorization', async () => {
      const res = await httpRequest({
        host: '127.0.0.1',
        port,
        path: '/api/checkins/today',
        method: 'OPTIONS',
        headers: {
          Origin: 'https://migraineguardian-frontend.onrender.com',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization,cache-control,pragma,content-type',
        },
      });

      assert.strictEqual(res.statusCode, 204, 'Preflight must return 204 No Content');
      assert.strictEqual(
        res.headers['access-control-allow-origin'],
        'https://migraineguardian-frontend.onrender.com',
        'Must allow exact production frontend origin'
      );
      assert.strictEqual(res.headers['access-control-allow-credentials'], 'true', 'Must allow credentials');
      assert(res.headers['access-control-allow-headers'], 'Must return access-control-allow-headers');

      const allowedHeaders = res.headers['access-control-allow-headers'].toLowerCase();
      assert(allowedHeaders.includes('authorization'), 'Allowed headers must include authorization');
      assert(allowedHeaders.includes('cache-control'), 'Allowed headers must include cache-control');
      assert(allowedHeaders.includes('pragma'), 'Allowed headers must include pragma');
      assert.strictEqual(res.headers['access-control-max-age'], '86400', 'Must specify 86400s maxAge for preflight caching');
    });

    await testAsync('OPTIONS preflight for POST /api/chat/message succeeds with correct methods and headers', async () => {
      const res = await httpRequest({
        host: '127.0.0.1',
        port,
        path: '/api/chat/message',
        method: 'OPTIONS',
        headers: {
          Origin: 'https://migraineguardian-frontend.onrender.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,content-type,x-request-id',
        },
      });

      assert.strictEqual(res.statusCode, 204);
      assert.strictEqual(res.headers['access-control-allow-origin'], 'https://migraineguardian-frontend.onrender.com');
      const methods = res.headers['access-control-allow-methods'] || '';
      assert(methods.includes('POST'), 'Must include POST in allowed methods');
    });

    await testAsync('CORS headers are present on successful 200 responses', async () => {
      const res = await httpRequest({
        host: '127.0.0.1',
        port,
        path: '/api/health',
        method: 'GET',
        headers: {
          Origin: 'https://migraineguardian-frontend.onrender.com',
        },
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers['access-control-allow-origin'], 'https://migraineguardian-frontend.onrender.com');
      assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
    });

    await testAsync('CORS headers are present on 401 Unauthorized error responses', async () => {
      const res = await httpRequest({
        host: '127.0.0.1',
        port,
        path: '/api/checkins/today',
        method: 'GET',
        headers: {
          Origin: 'https://migraineguardian-frontend.onrender.com',
        },
      });

      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.headers['access-control-allow-origin'], 'https://migraineguardian-frontend.onrender.com');
      assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
    });

    await testAsync('CORS headers are present on 404 Not Found error responses', async () => {
      const res = await httpRequest({
        host: '127.0.0.1',
        port,
        path: '/api/nonexistent-endpoint-route',
        method: 'GET',
        headers: {
          Origin: 'https://migraineguardian-frontend.onrender.com',
        },
      });

      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.headers['access-control-allow-origin'], 'https://migraineguardian-frontend.onrender.com');
    });

    await testAsync('Unauthorized origins are rejected without Access-Control-Allow-Origin headers', async () => {
      const resPreflight = await httpRequest({
        host: '127.0.0.1',
        port,
        path: '/api/health',
        method: 'OPTIONS',
        headers: {
          Origin: 'https://evil-attacker.com',
          'Access-Control-Request-Method': 'GET',
        },
      });

      assert(!resPreflight.headers['access-control-allow-origin'], 'Preflight from unauthorized origin must NOT receive allow-origin header');

      const resGet = await httpRequest({
        host: '127.0.0.1',
        port,
        path: '/api/health',
        method: 'GET',
        headers: {
          Origin: 'https://evil-attacker.com',
        },
      });

      assert(!resGet.headers['access-control-allow-origin'], 'GET from unauthorized origin must NOT receive allow-origin header');
    });

    await testAsync('Trailing slashes on Origin are sanitized and accepted', async () => {
      const res = await httpRequest({
        host: '127.0.0.1',
        port,
        path: '/api/health',
        method: 'GET',
        headers: {
          Origin: 'https://migraineguardian-frontend.onrender.com/',
        },
      });

      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['access-control-allow-origin'].startsWith('https://migraineguardian-frontend.onrender.com'));
    });

    await testAsync('Arbitrary origins containing migraineguardian are strictly rejected', async () => {
      const maliciousOrigins = [
        'https://migraineguardian-malicious.onrender.com',
        'https://attacker-migraineguardian.onrender.com',
        'https://evil-migraineguardian.vercel.app',
        'https://not-migraineguardian.com',
      ];

      for (const origin of maliciousOrigins) {
        const res = await httpRequest({
          host: '127.0.0.1',
          port,
          path: '/api/health',
          method: 'OPTIONS',
          headers: {
            Origin: origin,
            'Access-Control-Request-Method': 'GET',
          },
        });

        assert(
          !res.headers['access-control-allow-origin'],
          `Arbitrary origin ${origin} containing migraineguardian must be rejected`
        );
      }
    });

    await testAsync('Intended local development origins are permitted', async () => {
      const devOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
      ];

      for (const origin of devOrigins) {
        const res = await httpRequest({
          host: '127.0.0.1',
          port,
          path: '/api/health',
          method: 'GET',
          headers: {
            Origin: origin,
          },
        });

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers['access-control-allow-origin'], origin);
        assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
      }
    });

    // --- SUITE G: MOBILE AUTHENTICATION LIFECYCLE, POPUP RESOLVER & PERSISTENCE RESILIENCE ---
    console.log('\n--- SUITE G: Mobile Authentication Lifecycle & Persistence Resilience ---');

    test('firebase.js configures initializeAuth with browserPopupRedirectResolver, multi-tier persistence and strict error propagation', () => {
      const firebaseConfigPath = path.resolve(__dirname, '../../frontend/src/config/firebase.js');
      assert(fs.existsSync(firebaseConfigPath), 'firebase.js must exist');
      const content = fs.readFileSync(firebaseConfigPath, 'utf8');
      assert(content.includes('initializeAuth'), 'firebase.js must import and call initializeAuth');
      assert(content.includes('browserPopupRedirectResolver'), 'firebase.js must import browserPopupRedirectResolver');
      assert(content.includes('popupRedirectResolver'), 'firebase.js must configure popupRedirectResolver');
      assert(content.includes('indexedDBLocalPersistence'), 'firebase.js must include indexedDBLocalPersistence');
      assert(content.includes('browserLocalPersistence'), 'firebase.js must include browserLocalPersistence');
      assert(content.includes('inMemoryPersistence'), 'firebase.js must include inMemoryPersistence');
      assert(content.includes("err?.code === 'auth/already-initialized'"), 'firebase.js must only fall back to getAuth for auth/already-initialized');
      assert(content.includes('throw err;'), 'firebase.js must rethrow genuine configuration errors');
    });

    test('browserPopupRedirectResolver prevents auth/argument-error during initialization and popup sign-in', () => {
      const { initializeApp } = require('../../frontend/node_modules/firebase/app');
      const browserAuth = require('../../frontend/node_modules/firebase/node_modules/@firebase/auth/dist/browser-cjs/index-D1eM-zGc.js');

      // 1. Verify without popupRedirectResolver, auth._popupRedirectResolver is null (root cause of auth/argument-error)
      const testAppWithout = initializeApp({ apiKey: 'AIzaSyRegressionTestKey1', projectId: 'reg-test-1' }, 'regAppWithoutResolver');
      const authWithout = browserAuth.initializeAuth(testAppWithout, {
        persistence: [browserAuth.inMemoryPersistence],
      });
      assert.strictEqual(authWithout._popupRedirectResolver, null, 'Without resolver, _popupRedirectResolver must be null');

      // 2. Verify with browserPopupRedirectResolver, auth._popupRedirectResolver is properly populated
      const testAppWith = initializeApp({ apiKey: 'AIzaSyRegressionTestKey2', projectId: 'reg-test-2' }, 'regAppWithResolver');
      const authWith = browserAuth.initializeAuth(testAppWith, {
        persistence: [browserAuth.inMemoryPersistence],
        popupRedirectResolver: browserAuth.browserPopupRedirectResolver,
      });
      assert(authWith._popupRedirectResolver !== null, 'With browserPopupRedirectResolver, _popupRedirectResolver must be populated');
      assert.strictEqual(typeof authWith._popupRedirectResolver, 'object', '_popupRedirectResolver must be an object instance');
    });

    await testAsync('isTransientDatabaseClosingError correctly identifies mobile IndexedDB closing/hidden states', async () => {
      const { pathToFileURL } = await import('url');
      const authServicePath = path.resolve(__dirname, '../../frontend/src/services/authService.js');
      const { isTransientDatabaseClosingError } = await import(pathToFileURL(authServicePath).href);

      // Positive match cases
      assert.strictEqual(isTransientDatabaseClosingError(new Error('Database is closing/hidden')), true);
      assert.strictEqual(isTransientDatabaseClosingError(new Error('database is closing')), true);
      assert.strictEqual(isTransientDatabaseClosingError(new Error('IndexedDB transaction failed: isHiding')), true);
      assert.strictEqual(isTransientDatabaseClosingError({ name: 'AbortError', message: 'connection is closing' }), true);

      // Negative non-transient auth error cases
      assert.strictEqual(isTransientDatabaseClosingError(null), false);
      assert.strictEqual(isTransientDatabaseClosingError({ code: 'auth/wrong-password', message: 'Incorrect password.' }), false);
      assert.strictEqual(isTransientDatabaseClosingError({ code: 'auth/invalid-credential', message: 'Invalid credentials.' }), false);
      assert.strictEqual(isTransientDatabaseClosingError({ code: 'auth/user-not-found', message: 'User not found.' }), false);
      assert.strictEqual(isTransientDatabaseClosingError({ code: 'auth/argument-error', message: 'Firebase: Error (auth/argument-error).' }), false);
    });

    await testAsync('formatFirebaseError sanitizes all auth error codes including auth/argument-error', async () => {
      const { pathToFileURL } = await import('url');
      const authServicePath = path.resolve(__dirname, '../../frontend/src/services/authService.js');
      const { formatFirebaseError } = await import(pathToFileURL(authServicePath).href);

      // auth/argument-error mapping
      const argErrorSanitized = formatFirebaseError({ code: 'auth/argument-error', message: 'Firebase: Error (auth/argument-error).' });
      assert(!argErrorSanitized.includes('argument-error'), 'Must never leak raw internal argument-error string');
      assert(argErrorSanitized.includes('Authentication configuration error'), 'Must return clean user-friendly configuration message');

      // Transient IndexedDB error mapping
      const defaultSanitized = formatFirebaseError(new Error('Database is closing/hidden'));
      assert(!defaultSanitized.includes('Database is closing'), 'Must never leak raw internal Database is closing string');
      assert(!defaultSanitized.includes('hidden'), 'Must never leak raw internal hidden database state');
      assert(defaultSanitized.includes('Authentication storage is momentarily busy'), 'Must return helpful, friendly error message');

      const googleSanitized = formatFirebaseError(new Error('Database is closing/hidden'), 'google');
      assert(googleSanitized.includes('during Google sign-in'), 'Must provide clear Google-specific action guidance');

      const signupSanitized = formatFirebaseError(new Error('Database is closing/hidden'), 'signup');
      assert(signupSanitized.includes('Please try signing in'), 'Must guide user to sign in if account was already created');

      // Standard authentication error codes
      assert(formatFirebaseError({ code: 'auth/wrong-password' }).includes('Incorrect password'));
      assert(formatFirebaseError({ code: 'auth/invalid-credential' }).includes('Invalid email or password'));
      assert(formatFirebaseError({ code: 'auth/invalid-email' }).includes('valid email address format'));
      assert(formatFirebaseError({ code: 'auth/user-not-found' }).includes('No account found'));
      assert(formatFirebaseError({ code: 'auth/email-already-in-use' }).includes('already registered'));
      assert(formatFirebaseError({ code: 'auth/network-request-failed' }).includes('Network connection issue'));
    });

    await testAsync('logSafeAuthDiagnostic safely logs operation, stage, and code without leaking credentials', async () => {
      const { pathToFileURL } = await import('url');
      const authServicePath = path.resolve(__dirname, '../../frontend/src/services/authService.js');
      const { logSafeAuthDiagnostic } = await import(pathToFileURL(authServicePath).href);

      const fakeError = new Error('Firebase: Error (auth/argument-error).');
      fakeError.code = 'auth/argument-error';

      const diag = logSafeAuthDiagnostic('testOperation', 'testStage', fakeError);
      assert.strictEqual(diag.operation, 'testOperation');
      assert.strictEqual(diag.stage, 'testStage');
      assert.strictEqual(diag.errorCode, 'auth/argument-error');
      assert.strictEqual(diag.errorMessage, 'Firebase: Error (auth/argument-error).');
      assert(!('password' in diag), 'Must never record password');
      assert(!('token' in diag), 'Must never record token');
      assert(!('apiKey' in diag), 'Must never record apiKey');
    });

    await testAsync('executeAuthWithRetry recovers without synthetic DOM events or global persistence mutation', async () => {
      const { pathToFileURL } = await import('url');
      const authServicePath = path.resolve(__dirname, '../../frontend/src/services/authService.js');
      const { executeAuthWithRetry } = await import(pathToFileURL(authServicePath).href);

      let attempts = 0;
      const result = await executeAuthWithRetry(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Database is closing/hidden');
        }
        return { success: true, user: { uid: 'recovered_mobile_user' } };
      }, 2, 20);

      assert.strictEqual(attempts, 2, 'Must have attempted 2 times before succeeding');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.user.uid, 'recovered_mobile_user');
    });

    await testAsync('executeAuthWithRetry respects maxRetries and throws bounded error on persistent failure', async () => {
      const { pathToFileURL } = await import('url');
      const authServicePath = path.resolve(__dirname, '../../frontend/src/services/authService.js');
      const { executeAuthWithRetry } = await import(pathToFileURL(authServicePath).href);

      let attempts = 0;
      let caughtError = null;

      try {
        await executeAuthWithRetry(async () => {
          attempts++;
          throw new Error('Database is closing/hidden');
        }, 2, 10);
      } catch (err) {
        caughtError = err;
      }

      assert.strictEqual(attempts, 3, 'Should attempt initial call + 2 retries (total 3 attempts)');
      assert(caughtError !== null, 'Persistent error must be thrown once retries are exhausted');
      assert(caughtError.message.includes('Database is closing/hidden'));
    });

    await testAsync('authService protects against duplicate popups, duplicate signups, and password mismatch', async () => {
      const authServicePath = path.resolve(__dirname, '../../frontend/src/services/authService.js');
      const authContent = fs.readFileSync(authServicePath, 'utf8');

      // Verify signInWithPopup supplies popup redirect resolver
      assert(
        authContent.includes('signInWithPopup(auth, googleProvider, resolver)') ||
          authContent.includes('signInWithPopup(auth, googleProvider, browserPopupRedirectResolver)'),
        'signInWithPopup must pass popup redirect resolver'
      );

      // Verify signInWithPopup is NOT wrapped in automatic retry (prevents duplicate popup windows)
      assert(!authContent.includes('executeAuthWithRetry(() =>\n        signInWithPopup'), 'signInWithPopup must not be auto-retried with new popup');

      // Verify createUserWithEmailAndPassword is NOT wrapped in automatic retry (prevents auth/email-already-in-use on retry)
      assert(!authContent.includes('executeAuthWithRetry(() =>\n        createUserWithEmailAndPassword'), 'createUserWithEmailAndPassword must not be auto-retried');

      // Verify setPersistence is NOT imported or called during authentication retries
      assert(!authContent.includes('setPersistence(auth'), 'authService must not mutate global auth persistence during retries');
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
