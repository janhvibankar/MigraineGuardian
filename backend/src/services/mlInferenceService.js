/**
 * ML Inference Service (MigraineGuardian Node.js Express Gateway to FastAPI Microservice)
 *
 * Robust, production-grade integration with the FastAPI Python ML/XAI microservice.
 * Single source of truth for ML URL: ML_SERVICE_URL or FASTAPI_BASE_URL (read dynamically at runtime).
 * Defaults to http://127.0.0.1:8000 for local development.
 *
 * Reliability & Cold-Start Features:
 *  - Dynamic URL resolution: Evaluates process.env on every call, preventing premature caching.
 *  - Cold-start compatible timeouts: 65s per-attempt timeout and 75s bounded total deadline
 *    prevents premature abortion during Render 57s cold-starts while staying safely within
 *    gateway limits.
 *  - Transient gateway recovery: Catches 502, 503, 504, 408 and Cloudflare 520-524 cold-start
 *    statuses and retries with exponential backoff.
 *  - Connection refused recovery: Retries startup race conditions when Express starts before FastAPI.
 *  - Non-retryable error short-circuiting: 400, 422, and 404 fail immediately without wasting time.
 *  - Structured actionable logging: Identifies stage, safe host, status, elapsed time, attempt, and error code.
 *  - Sensitive data protection: URLs are sanitized to exclude any secrets or parameters.
 */

// Bounded timing configuration
const PER_ATTEMPT_TIMEOUT_MS = parseInt(process.env.ML_REQUEST_TIMEOUT_MS, 10) || 65000;
const TOTAL_DEADLINE_MS = parseInt(process.env.ML_TOTAL_DEADLINE_MS, 10) || 75000;
const RETRY_MAX = 3;
const INITIAL_RETRY_DELAY_MS = 2000;

// Transient HTTP error status codes (Render spin-up / Cloudflare proxy cold start)
const TRANSIENT_HTTP_STATUSES = new Set([408, 502, 503, 504, 520, 521, 522, 523, 524]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns the currently configured ML service base URL.
 * Evaluates process.env dynamically on every invocation.
 */
export function getMlServiceUrl(overrideUrl = null) {
  const rawUrl = overrideUrl || process.env.ML_SERVICE_URL || process.env.FASTAPI_BASE_URL || 'http://127.0.0.1:8000';
  const clean = rawUrl.trim().replace(/\/+$/, '');
  return clean.replace(/\/predict\/?$/, '');
}

/**
 * Strips secrets, credentials, and sensitive query parameters from a URL for safe logging.
 */
export function sanitizeUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    parsed.search = '';
    parsed.password = '';
    parsed.username = '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return String(rawUrl).split('?')[0];
  }
}

/**
 * Structured logger for ML inference gateway operations.
 */
function logMlEvent({ stage, safeHost, status = null, elapsedMs = 0, attempt = 1, maxAttempts = RETRY_MAX, error = null, details = null }) {
  const parts = [
    `[ML-GATEWAY]`,
    `Stage: ${stage}`,
    `Host: ${safeHost}`,
    `Attempt: ${attempt}/${maxAttempts}`,
    `Elapsed: ${elapsedMs}ms`,
  ];

  if (status !== null) {
    parts.push(`Status: ${status}`);
  }
  if (error) {
    parts.push(`Error: ${error}`);
  }

  const logLine = parts.join(' | ');

  if (stage === 'SUCCESS') {
    console.log(logLine);
  } else if (stage === 'RETRYING' || stage === 'WARMING') {
    console.warn(logLine);
  } else {
    console.error(logLine);
    if (details) {
      console.error('[ML-GATEWAY-DETAILS]', JSON.stringify(details));
    }
  }
}

/**
 * Single HTTP attempt to call the FastAPI /predict endpoint with strict deadline.
 */
async function callMlPredictAttempt(fullUrl, safeHost, mlPayload, timeoutMs, attempt, maxAttempts) {
  const controller = new AbortController();
  const startTime = Date.now();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(mlPayload),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const elapsedMs = Date.now() - startTime;

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}` };
      }

      const isTransient = TRANSIENT_HTTP_STATUSES.has(response.status);

      logMlEvent({
        stage: isTransient ? 'WARMING' : 'HTTP_ERROR',
        safeHost,
        status: response.status,
        elapsedMs,
        attempt,
        maxAttempts,
        error: errorData.detail || errorData.message || `HTTP ${response.status}`,
        details: errorData,
      });

      return {
        success: false,
        transient: isTransient,
        status: response.status,
        elapsedMs,
        error: {
          code: isTransient ? 'FASTAPI_SERVICE_WARMING' : 'FASTAPI_HTTP_ERROR',
          status: response.status,
          details: errorData,
          message:
            errorData.detail ||
            errorData.message ||
            `ML microservice returned HTTP ${response.status}`,
        },
      };
    }

    const json = await response.json();
    const elapsedMsTotal = Date.now() - startTime;

    if (typeof json.score !== 'number' || typeof json.level !== 'string') {
      logMlEvent({
        stage: 'INVALID_SCHEMA',
        safeHost,
        status: response.status,
        elapsedMs: elapsedMsTotal,
        attempt,
        maxAttempts,
        error: 'Missing required score or level field in ML response',
        details: json,
      });

      return {
        success: false,
        status: response.status,
        elapsedMs: elapsedMsTotal,
        error: {
          code: 'INVALID_ML_RESPONSE',
          message: 'FastAPI response missing required score or level field.',
        },
      };
    }

    logMlEvent({
      stage: 'SUCCESS',
      safeHost,
      status: response.status,
      elapsedMs: elapsedMsTotal,
      attempt,
      maxAttempts,
    });

    return {
      success: true,
      data: json,
      elapsedMs: elapsedMsTotal,
    };
  } catch (err) {
    clearTimeout(timer);
    const elapsedMs = Date.now() - startTime;

    if (err.name === 'AbortError') {
      logMlEvent({
        stage: 'TIMEOUT',
        safeHost,
        elapsedMs,
        attempt,
        maxAttempts,
        error: `Request timed out after ${timeoutMs}ms`,
      });

      return {
        success: false,
        timeout: true,
        elapsedMs,
        error: {
          code: 'FASTAPI_TIMEOUT',
          message: `FastAPI service request timed out after ${timeoutMs}ms.`,
        },
      };
    }

    const isConnRefused =
      err.code === 'ECONNREFUSED' ||
      err.cause?.code === 'ECONNREFUSED' ||
      err.message?.includes('fetch failed') ||
      err.message?.includes('ECONNREFUSED');

    logMlEvent({
      stage: isConnRefused ? 'CONNECTION_REFUSED' : 'NETWORK_ERROR',
      safeHost,
      elapsedMs,
      attempt,
      maxAttempts,
      error: err.cause?.message || err.message,
    });

    return {
      success: false,
      unavailable: true,
      elapsedMs,
      error: {
        code: 'FASTAPI_UNAVAILABLE',
        message: 'Unable to connect to FastAPI ML microservice.',
        details: err.cause?.code || err.code || err.message,
      },
    };
  }
}

export const mlInferenceService = {
  /**
   * Sends prediction & XAI request to FastAPI POST /predict.
   *
   * Features:
   *  - Total bounded deadline (75s default or shorter request-specific deadline)
   *  - Automatic bounded exponential backoff for cold-start 502/503/504 and connection refused
   *  - Immediate return on success or non-retryable client error (e.g. 400, 422, invalid schema)
   *  - Structured logging with safe host and elapsed timings
   *
   * @param {Object} mlPayload  { user_id, latest_log, baseline_stats, recent_episodes_count_7d, ... }
   * @param {string} [overrideUrl]  Optional override for testing
   * @param {Object} [options]  Optional parameters { deadlineMs?: number }
   * @returns {Promise<{success, data?, error?, unavailable?, timeout?, transient?, elapsedMs?}>}
   */
  predictMigraineRisk: async (mlPayload, overrideUrl = null, options = {}) => {
    const baseUrl = getMlServiceUrl(overrideUrl);
    const safeHost = sanitizeUrl(baseUrl);
    const fullUrl = `${baseUrl}/predict`;
    const pipelineStartTime = Date.now();
    const effectiveDeadlineMs = Math.min(
      TOTAL_DEADLINE_MS,
      (options && options.deadlineMs) || TOTAL_DEADLINE_MS
    );

    let lastResult = null;
    let attempt = 0;

    while (true) {
      attempt++;
      const elapsedSoFar = Date.now() - pipelineStartTime;
      const remainingTime = effectiveDeadlineMs - elapsedSoFar;

      if (remainingTime <= 2000) {
        logMlEvent({
          stage: 'DEADLINE_EXCEEDED',
          safeHost,
          elapsedMs: elapsedSoFar,
          attempt,
          maxAttempts: attempt,
          error: `Total operation deadline of ${effectiveDeadlineMs}ms reached`,
        });

        const wasWarming = lastResult?.transient || lastResult?.error?.code === 'FASTAPI_SERVICE_WARMING';
        return {
          success: false,
          timeout: !wasWarming,
          unavailable: false,
          transient: wasWarming,
          elapsedMs: elapsedSoFar,
          error: {
            code: wasWarming ? 'FASTAPI_SERVICE_WARMING' : 'FASTAPI_TIMEOUT',
            message: wasWarming
              ? 'The AI model service is warming up. Please click Calculate Forecast in a moment.'
              : `ML service request exceeded total deadline of ${effectiveDeadlineMs}ms.`,
            details: lastResult?.error?.details || null,
          },
        };
      }

      // Timeout for this attempt: min of per-attempt timeout and remaining budget
      const attemptTimeoutMs = Math.min(PER_ATTEMPT_TIMEOUT_MS, remainingTime);

      const result = await callMlPredictAttempt(
        fullUrl,
        safeHost,
        mlPayload,
        attemptTimeoutMs,
        attempt,
        'adaptive'
      );
      lastResult = result;

      // If successful, return immediately
      if (result.success) {
        return result;
      }

      // Non-retryable errors (400, 422 validation, 404, 401, 403, invalid schema) fail immediately
      const isRetryable =
        result.unavailable ||
        result.transient ||
        (result.timeout && (Date.now() - pipelineStartTime) < effectiveDeadlineMs - 5000);

      if (!isRetryable) {
        return result;
      }

      const currentElapsed = Date.now() - pipelineStartTime;

      // Connection refused (port completely closed/offline) fails fast after 3 attempts;
      // Transient 502/503/504 (Render container spinning up) retries across the full deadline
      if (result.unavailable && !result.transient && attempt >= 3) {
        logMlEvent({
          stage: 'CONN_REFUSED_EXHAUSTED',
          safeHost,
          elapsedMs: currentElapsed,
          attempt,
          maxAttempts: attempt,
          error: 'Connection refused after 3 attempts; service is not running on target port.',
        });
        break;
      }

      // Compute bounded exponential backoff delay (2s, 3s, 4.5s, max 5s)
      const delay = Math.min(
        INITIAL_RETRY_DELAY_MS * Math.pow(1.5, attempt - 1),
        5000
      );
      if (currentElapsed + delay >= effectiveDeadlineMs - 2000) {
        // Not enough budget to wait and retry
        break;
      }

      logMlEvent({
        stage: 'RETRYING',
        safeHost,
        status: result.status,
        elapsedMs: currentElapsed,
        attempt,
        maxAttempts: 'adaptive',
        error: `Retrying after ${Math.round(delay)}ms (${result.error?.code || 'transient error'})...`,
      });

      await sleep(delay);
    }

    const totalElapsedMs = Date.now() - pipelineStartTime;
    logMlEvent({
      stage: 'ALL_ATTEMPTS_EXHAUSTED',
      safeHost,
      elapsedMs: totalElapsedMs,
      attempt,
      maxAttempts: attempt,
      error: `All attempts exhausted or deadline (${effectiveDeadlineMs}ms) exceeded`,
    });

    const isWarming = lastResult?.transient || lastResult?.error?.code === 'FASTAPI_SERVICE_WARMING';

    return {
      success: false,
      unavailable: !isWarming,
      transient: isWarming,
      elapsedMs: totalElapsedMs,
      error: {
        code: isWarming ? 'FASTAPI_SERVICE_WARMING' : (lastResult?.error?.code || 'FASTAPI_UNAVAILABLE'),
        message: isWarming
          ? 'The AI model service is warming up. Please click Calculate Forecast in a moment.'
          : (lastResult?.error?.message || 'Unable to connect to FastAPI ML microservice. Ensure ML service is running.'),
        details: lastResult?.error?.details || null,
      },
    };
  },

  /**
   * Returns the currently configured FastAPI base URL (dynamically evaluated).
   */
  getFastApiBaseUrl: () => getMlServiceUrl(),
};
