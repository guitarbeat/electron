import { useCallback, useState } from "react";
import {
  getListEnterSelectionIndex,
  getNextListIndex,
} from "./workspaceListAutocomplete";

export const useWorkspaceAutocompleteNavigation = () => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const resetActiveIndex = useCallback(() => setActiveIndex(-1), []);
  const moveActiveIndex = useCallback(
    (direction: "next" | "previous", resultCount: number) =>
      setActiveIndex((currentIndex) =>
        getNextListIndex(currentIndex, direction, resultCount),
      ),
    [],
  );
  const getEnterSelectionIndex = useCallback(
    (resultCount: number) => getListEnterSelectionIndex(activeIndex, resultCount),
    [activeIndex],
  );

  return {
    activeIndex,
    setActiveIndex,
    resetActiveIndex,
    moveActiveIndex,
    getEnterSelectionIndex,
  };
};
