export const scrollStorage = {
  save: (key: string, data: unknown) => {
    try {
      sessionStorage.setItem(`scroll_state_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save scroll state", e);
    }
  },
  load: <T,>(key: string): T | null => {
    try {
      const data = sessionStorage.getItem(`scroll_state_${key}`);
      return data ? JSON.parse(data) as T : null;
    } catch (e) {
      console.warn("Failed to load scroll state", e);
      return null;
    }
  },
  clear: (key: string) => {
    try {
      sessionStorage.removeItem(`scroll_state_${key}`);
    } catch (e) {
      console.warn("Failed to clear scroll state", e);
    }
  }
};
