// On-device storage abstraction. No backend.
// Uses Capacitor Preferences when running natively (Android),
// and falls back to localStorage in the browser during development.
import { Preferences } from "@capacitor/preferences";

const hasPreferences = () => {
  try {
    return typeof Preferences?.get === "function";
  } catch {
    return false;
  }
};

export const storage = {
  async get(key) {
    try {
      if (hasPreferences()) {
        const { value } = await Preferences.get({ key });
        return value != null ? { value } : null;
      }
    } catch {
      /* fall through to localStorage */
    }
    try {
      const value = window.localStorage.getItem(key);
      return value != null ? { value } : null;
    } catch {
      return null;
    }
  },

  async set(key, value) {
    try {
      if (hasPreferences()) {
        await Preferences.set({ key, value });
        return;
      }
    } catch {
      /* fall through to localStorage */
    }
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
};
