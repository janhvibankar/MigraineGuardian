import { apiClient } from './apiClient.js';

let warmupTriggered = false;
let lastWarmupTime = 0;

/**
 * Triggers non-blocking background wake-up pings to:
 * 1. Express Backend Gateway: /health
 * 2. FastAPI ML Microservice: /ml-health?timeout=5000
 * 3. RAG Chatbot Service: /chat-health
 *
 * Runs strictly in the background without blocking UI render or navigation.
 * Bounded by debounce so rapid page switches do not spam Render endpoints.
 * Does NOT run 24/7 background cron tasks to conserve free tier hours.
 */
export function triggerBackgroundWarmup(force = false) {
  const now = Date.now();
  // Throttle warmup pings to at most once every 3 minutes
  if (!force && warmupTriggered && now - lastWarmupTime < 180000) {
    return;
  }
  warmupTriggered = true;
  lastWarmupTime = now;

  console.log('[WarmupService] Initiating parallel background service warm-up pings...');

  Promise.allSettled([
    apiClient.get('/health', null, { bypassCache: true }).catch(() => {}),
    apiClient.get('/ml-health?timeout=5000', null, { bypassCache: true }).catch(() => {}),
    apiClient.get('/chat-health', null, { bypassCache: true }).catch(() => {}),
  ]).then((results) => {
    const statuses = results.map((r, i) => {
      const name = ['Backend', 'ML Service', 'RAG Chatbot'][i];
      const ok = r.status === 'fulfilled' && r.value && r.value.ok;
      return `${name}: ${ok ? 'online' : 'warming/pending'}`;
    });
    console.log('[WarmupService] Service states:', statuses.join(' | '));
  }).catch(() => {});
}
