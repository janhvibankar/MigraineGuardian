import { apiClient } from './apiClient.js';
import { auth } from '../config/firebase.js';

let isPolling = false;
let pollingTimer = null;
let pollStartTime = 0;
const MAX_POLL_DURATION_MS = 120000; // Poll for at most 2 minutes (~120s)
const POLL_INTERVAL_MS = 10000; // Check every 10 seconds

let mlOnline = false;
let ragOnline = false;

async function checkServiceHealth() {
  const checks = [];

  if (!mlOnline) {
    checks.push(
      apiClient
        .get('/ml-health?timeout=8000', null, { bypassCache: true })
        .then((res) => {
          if (res.ok && res.data?.status === 'ok') {
            mlOnline = true;
            console.log('[WarmupService] ML prediction microservice is ONLINE.');
          }
        })
        .catch(() => {})
    );
  }

  if (!ragOnline) {
    checks.push(
      apiClient
        .get('/chat-health?timeout=8000', null, { bypassCache: true })
        .then((res) => {
          if (res.ok && res.data?.status === 'ok') {
            ragOnline = true;
            console.log('[WarmupService] RAG Chatbot assistant service is ONLINE.');
          }
        })
        .catch(() => {})
    );
  }

  await Promise.allSettled(checks);
}

function stopPolling() {
  if (pollingTimer) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
  isPolling = false;
}

function runPollingLoop() {
  if (!isPolling) return;

  const elapsed = Date.now() - pollStartTime;
  if (elapsed >= MAX_POLL_DURATION_MS || (mlOnline && ragOnline)) {
    console.log(
      `[WarmupService] Polling loop completed after ${Math.round(elapsed / 1000)}s (ML=${mlOnline ? 'online' : 'warming'}, RAG=${ragOnline ? 'online' : 'warming'}).`
    );
    stopPolling();
    return;
  }

  // Continue checking only while page is visible
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    pollingTimer = setTimeout(runPollingLoop, POLL_INTERVAL_MS);
    return;
  }

  checkServiceHealth().finally(() => {
    if (mlOnline && ragOnline) {
      stopPolling();
      return;
    }
    if (isPolling) {
      pollingTimer = setTimeout(runPollingLoop, POLL_INTERVAL_MS);
    }
  });
}

/**
 * Triggers non-blocking background wake-up pings to:
 * 1. Express Backend Gateway: /health
 * 2. FastAPI ML Microservice: /ml-health
 * 3. RAG Chatbot Service: /chat-health
 *
 * If either ML or RAG responds as warming/503/timeout, continues polling every ~10s
 * for at most 2 minutes, ensuring services wake up smoothly in the background.
 */
export function triggerBackgroundWarmup(force = false) {
  // Always ping the Express backend gateway once
  apiClient.get('/health', null, { bypassCache: true }).catch(() => {});

  if (force) {
    mlOnline = false;
    ragOnline = false;
  }

  if (mlOnline && ragOnline && !force) {
    return;
  }

  if (isPolling) {
    return;
  }

  isPolling = true;
  pollStartTime = Date.now();
  console.log('[WarmupService] Starting smart warmup & readiness monitoring loop...');

  checkServiceHealth().finally(() => {
    if (mlOnline && ragOnline) {
      isPolling = false;
      return;
    }
    pollingTimer = setTimeout(runPollingLoop, POLL_INTERVAL_MS);
  });
}
