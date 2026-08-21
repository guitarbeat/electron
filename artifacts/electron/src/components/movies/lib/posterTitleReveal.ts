export type PosterClickAction = "reveal-title" | "open-details";

/** First click shows the title; a second click on the same poster opens details. */
export const nextPosterClickAction = (
  isTitleVisible: boolean,
): PosterClickAction => (isTitleVisible ? "open-details" : "reveal-title");
