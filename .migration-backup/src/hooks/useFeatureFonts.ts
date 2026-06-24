import { useEffect } from "react";
import { loadFeatureFonts } from "@/utils/loadFeatureFonts";

/** Loads quiz/memories feature fonts once when a feature surface mounts. */
export const useFeatureFonts = (): void => {
  useEffect(() => {
    void loadFeatureFonts();
  }, []);
};
