const STORAGE_PREFIX = 'mg_v1_';

function isStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export const storageService = {
  getItem: (key, defaultValue = null) => {
    if (!isStorageAvailable()) return defaultValue;
    try {
      const item = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Storage read error for key: ${key}`, e);
      return defaultValue;
    }
  },

  setItem: (key, value) => {
    if (!isStorageAvailable()) return false;
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Storage write error for key: ${key}`, e);
      return false;
    }
  },

  removeItem: (key) => {
    if (!isStorageAvailable()) return false;
    try {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return true;
    } catch (e) {
      console.warn(`Storage remove error for key: ${key}`, e);
      return false;
    }
  },

  clearAll: () => {
    if (!isStorageAvailable()) return false;
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(STORAGE_PREFIX))
        .forEach((k) => window.localStorage.removeItem(k));
      return true;
    } catch (e) {
      console.warn('Storage clear error', e);
      return false;
    }
  },
};

export default storageService;
