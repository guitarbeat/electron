export interface MessageKeydownState {
  key: string;
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  isComposing?: boolean;
}

export const shouldSubmitMessageOnKeyDown = ({
  key,
  shiftKey,
  isComposing = false,
}: MessageKeydownState): boolean => {
  if (isComposing) {
    return false;
  }

  if (key !== "Enter") {
    return false;
  }

  if (shiftKey) {
    return false;
  }

  return true;
};
