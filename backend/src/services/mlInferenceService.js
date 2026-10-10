/**
 * ML Inference Service (Phase 4D — Node.js to FastAPI Gateway Client)
 *
 * Handles HTTP requests to the FastAPI Python ML/XAI microservice.
 * Single source of truth for ML URL: FASTAPI_BASE_URL in backend/.env
 * Defaults to http://127.0.0.1:8000 if env var is missing.
 *
 * Features:
 *  - 15s timeout per attempt (allows SHAP computation on first request)
 *  - Bounded retry (max 3 attempts, 2s apart) for connection-refused ONLY
 *    → handles the startup race condition where Express starts before FastAPI
 *  - Timeout and HTTP errors are NOT retried (different root cause)
 *  - Separate error codes: FASTAPI_UNAVAILABLE / FASTAPI_TIMEOUT / FASTAPI_HTTP_ERROR / INVALID_ML_RESPONSE
 */

const FASTAPI_BASE_URL = process.env.ML_SERVICE_URL || process.env.FASTAPI_BASE_URL;

if (!FASTAPI_BASE_URL) {
  console.warn('[PREDICTION] WARNING: ML_SERVICE_URL is not set. ML prediction will fail.');
}

const DEFAULT_TIMEOUT_MS = 15000;

const RETRY_MAX = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Single attempt to call the FastAPI /predict endpoint.
 * Returns a typed result object — never throws.
 */
async function callMlService(url, mlPayload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    console.log(`[PREDICTION] Calling ML service: ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(mlPayload),
      signal: controller.signal,
    });

    clearTimeout(timer);
    console.log(`[PREDICTION] ML response status: ${response.status}`);

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}` };
      }
      console.warn(`[PREDICTION] ML HTTP error ${response.status}`, errorData);
      return {
        success: false,
        error: {
          code: 'FASTAPI_HTTP_ERROR',
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
    console.log(
      `[PREDICTION] ML response: score=${json.score}, level=${json.level}, model=${json.model_used}, features=${json.xai?.features?.length ?? 0}`
    );

    if (typeof json.score !== 'number' || typeof json.level !== 'string') {
      console.warn('[PREDICTION] Invalid ML response structure', json);
      return {
        success: false,
        error: {
          code: 'INVALID_ML_RESPONSE',
          message: 'FastAPI response missing required score or level field.',
        },
      };
    }

    return { success: true, data: json };
  } catch (err) {
    clearTimeout(timer);

    if (err.name === 'AbortError') {
      console.error(`[PREDICTION] ML request TIMED OUT after ${DEFAULT_TIMEOUT_MS}ms — ${url}`);
      return {
        success: false,
        timeout: true,
        error: {
          code: 'FASTAPI_TIMEOUT',
          message: `FastAPI service timed out after ${DEFAULT_TIMEOUT_MS}ms.`,
        },
      };
    }

    // Connection refused / network unreachable
    const detailedError = err.cause ? err.cause.message : err.message;
    console.error(`[PREDICTION] ML service UNREACHABLE — ${url}: ${err.name}: ${detailedError}`);
    if (err.cause) {
      console.error(`[ML] ${err.cause.code || 'ERROR'} ${url}`);
    } else {
      console.error(`[ML] ${err.code || 'ERROR'} ${url}`);
    }
    
    return {
      success: false,
      unavailable: true,
      error: {
        code: 'FASTAPI_UNAVAILABLE',
        message: 'Unable to connect to FastAPI ML microservice.',
      },
    };
  }
}

export const mlInferenceService = {
  /**
   * Sends prediction & XAI request to FastAPI POST /predict.
   *
   * Auto-retries up to RETRY_MAX times (RETRY_DELAY_MS apart) on
   * connection-refused errors only — handles startup timing race condition.
   * Timeout and HTTP errors are returned immediately without retry.
   *
   * @param {Object} mlPayload  { user_id, latest_log, baseline_stats, recent_episodes_count_7d, ... }
   * @param {string} [overrideUrl]  Optional override for testing
   * @returns {Promise<{success, data?, error?, unavailable?, timeout?}>}
   */
  predictMigraineRisk: async (mlPayload, overrideUrl = null) => {
    const baseUrl = overrideUrl || FASTAPI_BASE_URL;
    const url = `${baseUrl}/predict`;

    for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
      const result = await callMlService(url, mlPayload);

      // Success or non-retryable error → return immediately
      if (result.success || result.timeout || !result.unavailable) {
        return result;
      }

      // Connection refused → retry if attempts remain
      if (attempt < RETRY_MAX) {
        console.warn(
          `[PREDICTION] Attempt ${attempt}/${RETRY_MAX} failed (connection refused). ` +
            `Retrying in ${RETRY_DELAY_MS}ms...`
        );
        await sleep(RETRY_DELAY_MS);
      } else {
        console.error(
          `[PREDICTION] All ${RETRY_MAX} attempts exhausted. ML service unreachable at ${url}`
        );
        console.error(
          `[PREDICTION] → Start ML service: cd ml-service && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
        );
      }
    }

    return {
      success: false,
      unavailable: true,
      error: {
        code: 'FASTAPI_UNAVAILABLE',
        message:
          'Unable to connect to FastAPI ML microservice after retries. Ensure ML service is running.',
      },
    };
  },

  /**
   * Returns the configured FastAPI base URL (from FASTAPI_BASE_URL env var).
   * Use this when you need to construct other ML service endpoint URLs.
   */
  getFastApiBaseUrl: () => FASTAPI_BASE_URL,
};
