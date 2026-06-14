export const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    // Explicitly check for supported protocols to match tests expectations
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false;
    }
    return true;
  } catch {
    return false;
  }
};
