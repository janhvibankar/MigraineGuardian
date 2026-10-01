/**
 * ML Inference Service (Phase 4D — Node.js to FastAPI Gateway Client)
 *
 * Handles HTTP requests to the FastAPI Python ML/XAI microservice.
 * Communicates via FASTAPI_BASE_URL (defaults to http://127.0.0.1:8000)
 * with timeout handling, validation, and graceful error fallback.
 */

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://127.0.0.1:8000';
const DEFAULT_TIMEOUT_MS = 5000;

export const mlInferenceService = {
  /**
   * Sends prediction & XAI request payload to FastAPI service (`POST /predict`).
   *
   * @param {Object} mlPayload Request schema containing user_id, latest_log, baseline_stats, recent_episodes_count_7d
   * @param {string} [overrideUrl] Optional override URL for testing
   * @returns {Promise<{success: boolean, data?: Object, error?: Object, unavailable?: boolean, timeout?: boolean}>}
   */
  predictMigraineRisk: async (mlPayload, overrideUrl = null) => {
    const baseUrl = overrideUrl || process.env.FASTAPI_BASE_URL || 'http://127.0.0.1:8000';
    const url = `${baseUrl}/predict`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);


    try {
      console.log(`[PREDICTION] ML service URL: ${url}`);
      console.log(`[PREDICTION] Calling ML service...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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
        } catch (e) {
          errorData = { message: `HTTP status ${response.status}` };
        }

        console.warn(`[PREDICTION] ML request failed: HTTP ${response.status}`, errorData);
        return {
          success: false,
          error: {
            code: 'FASTAPI_HTTP_ERROR',
            status: response.status,
            details: errorData,
            message: errorData.detail || errorData.message || `ML microservice returned HTTP ${response.status}`,
          },
        };
      }

      const json = await response.json();
      console.log(`[PREDICTION] ML response body: score=${json.score}, level=${json.level}, model=${json.model_used}, features_count=${json.xai?.features?.length || 0}`);

      // Validate required response fields from FastAPI
      if (typeof json.score !== 'number' || typeof json.level !== 'string') {
        console.warn('[PREDICTION] ML request failed: invalid response payload structure', json);
        return {
          success: false,
          error: {
            code: 'INVALID_ML_RESPONSE',
            message: 'FastAPI response payload missing required score or level field.',
          },
        };
      }

      return {
        success: true,
        data: json,
      };
    } catch (err) {
      clearTimeout(timer);

      if (err.name === 'AbortError') {
        console.warn(`[PREDICTION] ML request failed: timeout after ${DEFAULT_TIMEOUT_MS}ms`);
        return {
          success: false,
          timeout: true,
          error: {
            code: 'FASTAPI_TIMEOUT',
            message: `FastAPI service timed out after ${DEFAULT_TIMEOUT_MS}ms.`,
          },
        };
      }

      console.warn(`[PREDICTION] ML request failed: connection error (${err.message})`);
      return {
        success: false,
        unavailable: true,
        error: {
          code: 'FASTAPI_UNAVAILABLE',
          message: 'Unable to connect to FastAPI ML microservice. Ensure ML service is running.',
        },
      };
    }
  },

  /**
   * Returns configured base URL for FastAPI service.
   */
  getFastApiBaseUrl: () => FASTAPI_BASE_URL,
};
