export type ThemeName = "movies" | "places" | "cyber" | "retro";

export interface AppThemeDefinition {
  name: ThemeName;
  semantic: {
    background: string;
    surface1: string;
    surface2: string;
    border: string;
    accent: string;
    textPrimary: string;
    textSecondary: string;
  };
}

export const themes: Record<ThemeName, AppThemeDefinition> = {
  movies: {
    name: "movies",
    semantic: {
      background: "#07091a",
      surface1: "#0c122a",
      surface2: "#141c3d",
      border: "rgba(148, 163, 200, 0.16)",
      accent: "#38bdf8",
      textPrimary: "#f0f4ff",
      textSecondary: "#94a3b8",
    },
  },
  places: {
    name: "places",
    semantic: {
      background: "#0a141a",
      surface1: "#0f202a",
      surface2: "#163140",
      border: "rgba(148, 200, 180, 0.16)",
      accent: "#34d399",
      textPrimary: "#f0fdf4",
      textSecondary: "#94a3b8",
    },
  },
  cyber: {
    name: "cyber",
    semantic: {
      background: "#050814",
      surface1: "#091228",
      surface2: "#102046",
      border: "rgba(0, 240, 255, 0.25)",
      accent: "#00f0ff",
      textPrimary: "#ffffff",
      textSecondary: "#7dd3fc",
    },
  },
  retro: {
    name: "retro",
    semantic: {
      background: "#180a22",
      surface1: "#261036",
      surface2: "#381850",
      border: "rgba(244, 114, 182, 0.2)",
      accent: "#f472b6",
      textPrimary: "#fff1f2",
      textSecondary: "#fbcfe8",
    },
  },
};

export const colors = {
  accent: "#38bdf8",
  background: "#07091a",
  surface1: "#0c122a",
  border: "rgba(255, 255, 255, 0.12)",
  textPrimary: "#ffffff",
  textSecondary: "#94a3b8",
};

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
};
