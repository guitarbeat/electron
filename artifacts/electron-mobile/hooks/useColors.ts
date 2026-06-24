import { useColorScheme } from "react-native";
import colors from "@/constants/colors";

export function useColors() {
  const scheme = useColorScheme();
  const palette =
    scheme === "light" && "light" in colors
      ? (colors as Record<string, typeof colors.dark>).light
      : colors.dark;
  return { ...palette, radius: colors.radius };
}
