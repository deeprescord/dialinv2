/**
 * Safe localStorage wrapper for browsers with strict privacy settings (e.g., Brave, private browsing)
 * Falls back to in-memory storage when localStorage is blocked or unavailable
 */

// In-memory fallback storage
const memoryStorage: Record<string, string> = {};

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      // localStorage blocked - use memory fallback
      return memoryStorage[key] ?? null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // localStorage blocked - use memory fallback
      memoryStorage[key] = value;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // localStorage blocked - use memory fallback
      delete memoryStorage[key];
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (e) {
      // localStorage blocked - clear memory fallback
      Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
    }
  }
};
