type ViewTransitionCapableDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    finished: Promise<void>;
  };
};

/** Run a DOM update with a View Transition when supported and not disabled. */
export const runWithViewTransition = (
  update: () => void,
  disabled: boolean,
): void => {
  if (disabled) {
    update();
    return;
  }

  const transitionDocument = document as ViewTransitionCapableDocument;
  if (typeof transitionDocument.startViewTransition === "function") {
    transitionDocument.startViewTransition(update);
    return;
  }

  update();
};
