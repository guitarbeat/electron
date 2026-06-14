export const sanitizeInput = (input: string): string => {
  if (!input) return "";
  // Basic sanitization to prevent XSS in error messages
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};
