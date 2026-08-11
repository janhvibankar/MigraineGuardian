const STORAGE_PREFIX = 'mg_v1_';

export const storageService = {
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Storage read error for key: ${key}`, e);
      return defaultValue;
    }
  },

  setItem: (key, value) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Storage write error for key: ${key}`, e);
      return false;
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return true;
    } catch (e) {
      console.warn(`Storage remove error for key: ${key}`, e);
      return false;
    }
  },

  clearAll: () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(STORAGE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
      return true;
    } catch (e) {
      console.warn('Storage clear error', e);
      return false;
    }
  },
};
