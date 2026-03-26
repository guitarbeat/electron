/**
 * Browser-specific utilities for clipboard access.
 */

export const copyTextToClipboard = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const fallbackField = document.createElement('textarea');
  fallbackField.value = value;
  fallbackField.setAttribute('readonly', 'true');
  fallbackField.style.position = 'fixed';
  fallbackField.style.opacity = '0';
  fallbackField.style.pointerEvents = 'none';

  document.body.appendChild(fallbackField);
  fallbackField.focus();
  fallbackField.select();

  const didCopy = document.execCommand('copy');
  document.body.removeChild(fallbackField);

  if (!didCopy) {
    throw new Error('Clipboard unavailable');
  }
};
