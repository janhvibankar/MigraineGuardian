/**
 * detectMessageLanguage.js
 *
 * Lightweight, zero-dependency utility to determine the chatbot response
 * language from the user's current message text.
 *
 * Priority:
 *   1. Devanagari script detection  -> mr or hi (script is unambiguous)
 *   2. UI language fallback          -> used for Roman-script input where
 *      the language is ambiguous (e.g. "mala migraine ka hoto?" could be
 *      Roman Marathi or Roman Hindi; UI language is the best available signal)
 *
 * Supported output values: 'en' | 'hi' | 'mr'
 *
 * NOTE: This intentionally does NOT cover every edge-case. The goal is to
 * fix the specific bug where Devanagari input was being sent to the RAG
 * API with language="en" because the website UI language was English.
 */

// ---------------------------------------------------------------------------
// Marathi-specific Devanagari character/word hints
// These are common Marathi words / suffixes that do NOT appear in Hindi.
// We check these to distinguish mr from hi when Devanagari is detected.
// ---------------------------------------------------------------------------
const MARATHI_HINTS = [
  // Common Marathi words
  '\u0906\u0939\u0947', '\u0906\u0939\u0947\u0924', '\u0928\u093E\u0939\u0940', '\u0906\u0923\u093F', '\u0915\u093E\u092F', '\u0915\u0938\u0947', '\u0915\u0927\u0940', '\u0915\u094B\u0923', '\u0915\u0941\u0920\u0947',
  '\u092E\u0932\u093E', '\u092E\u093E\u092F\u0917\u094D\u0930\u0947\u0928', '\u0921\u094B\u0915\u0947', '\u0926\u0941\u0916\u0923\u0947', '\u0924\u094D\u0930\u093E\u0938', '\u0909\u092A\u093E\u092F', '\u0905\u0938\u0924\u0947', '\u0905\u0938\u0924\u094B',
  '\u092E\u094D\u0939\u0923\u091C\u0947', '\u092E\u094D\u0939\u0923\u0942\u0928', '\u0939\u094B\u0924\u094B', '\u0939\u094B\u0924\u0947', '\u091D\u093E\u0932\u0947', '\u091D\u093E\u0932\u0940', '\u0938\u093E\u0902\u0917\u093E', '\u0915\u0930\u093E',
  '\u0935\u0947\u0933', '\u0926\u093F\u0935\u0938', '\u0930\u093E\u0924\u094D\u0930\u0940', '\u0916\u0942\u092A', '\u0925\u094B\u0921\u0947', '\u091C\u093E\u0938\u094D\u0924',
  // Marathi-specific Devanagari letters not found in Hindi
  '\u0933', '\u0931',
];

// Hindi-specific Devanagari word hints
const HINDI_HINTS = [
  '\u0939\u0948', '\u0939\u0948\u0902', '\u0928\u0939\u0940\u0902', '\u0914\u0930', '\u0915\u094D\u092F\u093E', '\u0915\u0948\u0938\u0947', '\u0915\u092C', '\u0915\u094C\u0928', '\u0915\u0939\u093E\u0901',
  '\u092E\u0941\u091D\u0947', '\u092E\u093E\u0907\u0917\u094D\u0930\u0947\u0928', '\u0938\u093F\u0930', '\u0926\u0930\u094D\u0926', '\u092A\u0930\u0947\u0936\u093E\u0928\u0940', '\u0909\u092A\u093E\u092F', '\u0939\u094B\u0924\u093E', '\u0939\u094B\u0924\u0940',
  '\u092E\u0924\u0932\u092C', '\u0907\u0938\u0932\u093F\u090F', '\u0939\u0941\u0906', '\u0939\u0941\u0908', '\u092C\u0924\u093E\u090F\u0902', '\u0915\u0930\u0947\u0902', '\u0938\u092E\u092F', '\u0926\u093F\u0928',
  '\u0930\u093E\u0924', '\u092C\u0939\u0941\u0924', '\u0925\u094B\u0921\u093C\u093E', '\u091C\u093C\u094D\u092F\u093E\u0926\u093E',
];

// Devanagari Unicode block: U+0900-U+097F
const DEVANAGARI_RE = /[\u0900-\u097F]/;

/**
 * Count how many hint strings from the list appear in the text.
 * @param {string} text
 * @param {string[]} hints
 * @returns {number}
 */
function countHints(text, hints) {
  return hints.reduce((count, hint) => (text.includes(hint) ? count + 1 : count), 0);
}

/**
 * Determine the language code to send to the RAG API based on:
 *   - The user's current message text (script detection)
 *   - The website UI language as fallback for Roman-script input
 *
 * @param {string} messageText  - The raw message the user just typed
 * @param {string} uiLanguage   - Current website UI language ('en'|'hi'|'mr')
 * @returns {'en'|'hi'|'mr'}
 */
export function detectMessageLanguage(messageText, uiLanguage) {
  const text = (messageText || '').trim();

  // --- Step 1: Check for Devanagari script (unambiguous signal) ---
  if (DEVANAGARI_RE.test(text)) {
    const marathiScore = countHints(text, MARATHI_HINTS);
    const hindiScore   = countHints(text, HINDI_HINTS);

    if (marathiScore > hindiScore) {
      console.debug(
        '[detectMessageLanguage] Devanagari -> mr | marathi:', marathiScore, 'hindi:', hindiScore
      );
      return 'mr';
    }
    if (hindiScore > marathiScore) {
      console.debug(
        '[detectMessageLanguage] Devanagari -> hi | hindi:', hindiScore, 'marathi:', marathiScore
      );
      return 'hi';
    }

    // Tied / no specific hints: prefer UI language if it is Devanagari-compatible.
    if (uiLanguage === 'mr' || uiLanguage === 'hi') {
      console.debug('[detectMessageLanguage] Devanagari tied -> UI language:', uiLanguage);
      return uiLanguage;
    }
    // UI is English but user typed Devanagari -> default hi (most common)
    console.debug('[detectMessageLanguage] Devanagari tied, UI=en -> hi');
    return 'hi';
  }

  // --- Step 2: Roman / ASCII script --- UI language is the best available signal.
  // Roman Marathi ("mala migraine ka hoto?") and Roman Hindi ("mujhe migraine
  // kya hai?") are indistinguishable without a full NLP model. If the UI is
  // already set to Marathi or Hindi, the user most likely intends that language.
  const resolvedUiLang = ['en', 'hi', 'mr'].includes(uiLanguage) ? uiLanguage : 'en';
  console.debug('[detectMessageLanguage] Roman script -> UI fallback:', resolvedUiLang);
  return resolvedUiLang;
}

export default detectMessageLanguage;
