import React from "react";

export const lazyWithRetry = <T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> =>
  React.lazy(async () => {
    try {
      return await importFn();
    } catch (err) {
      console.warn("Dynamic import failed, retrying chunk load...", err);
      await new Promise((resolve) => setTimeout(resolve, 800));
      return await importFn();
    }
  });

export default lazyWithRetry;
