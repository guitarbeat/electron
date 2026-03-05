export interface GeminiPart {
  text?: string;
}

export interface GeminiContent {
  parts?: GeminiPart[];
  role?: string;
}

export interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
  index?: number;
  safetyRatings?: any[];
}

export interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: any;
}

export const extractTextFromResponse = (json: GeminiResponse): string => {
  return (
    json?.candidates?.[0]?.content?.parts
      ?.map((p) => p?.text)
      .filter((t): t is string => Boolean(t))
      .join('\n') || ''
  );
};
