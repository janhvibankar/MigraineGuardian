import en from './locales/en';
import hi from './locales/hi';
import mr from './locales/mr';

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

export const translations = {
  en,
  hi,
  mr,
};

/**
 * Safe deep property getter by path string like 'dashboard.todaysRiskEstimate'
 */
function getNestedTranslation(obj, path) {
  if (!obj || !path) return null;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

/**
 * Translate a key into target language with fallback to English, supporting parameter interpolation.
 * Example: translate('en', 'dashboard.welcomeBack', { name: 'Janhvi' })
 */
export function translate(language, key, params = {}) {
  const targetDict = translations[language] || translations.en;
  let text = getNestedTranslation(targetDict, key);

  // Fallback to English if missing in target dictionary
  if (text === null && language !== 'en') {
    text = getNestedTranslation(translations.en, key);
  }

  // Fallback to key if not found in English
  if (text === null) {
    return key;
  }

  // Interpolate parameters like {name}, {count}, {score}, {level}
  if (params && typeof params === 'object') {
    return Object.keys(params).reduce((acc, paramKey) => {
      const regex = new RegExp(`\\{${paramKey}\\}`, 'g');
      return acc.replace(regex, String(params[paramKey]));
    }, text);
  }

  return text;
}

export default {
  LANGUAGES,
  translations,
  translate,
};
