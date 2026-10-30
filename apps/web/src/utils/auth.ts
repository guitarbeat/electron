export const hasStoredPinAccess = (user: string): boolean => {
  try {
    return localStorage.getItem(`pin_verified_${user}`) === "true";
  } catch {
    return false;
  }
};

export const setStoredPinAccess = (user: string, granted: boolean): void => {
  try {
    if (granted) {
      localStorage.setItem(`pin_verified_${user}`, "true");
    } else {
      localStorage.removeItem(`pin_verified_${user}`);
    }
  } catch {
    // Ignore storage issues
  }
};
