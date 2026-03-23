export const normalizeMovieTitle = (title: string): string => title.trim().toLowerCase();

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

export const shareSuggestionLink = async (
  title: string,
  suggestedBy: string,
  url: string
): Promise<'native' | 'copy'> => {
  const shareData = {
    title: `Movie night pick: ${title}`,
    text:
      suggestedBy === 'Someone'
        ? `Save "${title}" into the watchlist suggestions.`
        : `${suggestedBy} wants to save "${title}" into the watchlist.`,
    url,
  };

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(shareData);
      return 'native';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
    }
  }

  await copyTextToClipboard(url);
  return 'copy';
};
