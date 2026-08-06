import type { Message, User } from "@/shared/types";

export const IOS_GRAY = "#e5e5ea";
export const IOS_TIMESTAMP = "#8e8e93";

export const AARON_BUBBLE_COLOR = "#c07842";
export const ELECTRA_BUBBLE_COLOR = "#5e8a78";

export const getBubbleColor = (author: string): string => {
  if (author === "Aaron") return AARON_BUBBLE_COLOR;
  if (author === "Electra") return ELECTRA_BUBBLE_COLOR;
  return IOS_GRAY;
};

export const getBubbleTextColor = (author: string): string => {
  if (author === "Aaron" || author === "Electra") return "#ffffff";
  return "#000000";
};

export const isMessageFromCurrentUser = (
  message: Message,
  currentUser: User | null,
): boolean => Boolean(currentUser) && message.author === currentUser;

export interface MessageKeydownState {
  key: string;
  shiftKey: boolean;
  isComposing?: boolean;
}

export const shouldSubmitMessageOnKeyDown = ({
  key,
  shiftKey,
  isComposing = false,
}: MessageKeydownState): boolean =>
  !isComposing && key === "Enter" && !shiftKey;
