export interface DeploymentLocation {
  hostname?: string;
  search?: string;
}

export interface DeploymentEnv {
  DEV?: boolean;
  MODE?: string;
  NODE_ENV?: string;
  VITE_APP_ENV?: string;
  APP_ENV?: string;
  VERCEL_ENV?: string;
}

/**
 * Determines whether the current environment / deployment is a development deployment.
 *
 * Returns true for:
 * - Vite dev server (`import.meta.env.DEV` or `MODE === 'development'`)
 * - Development environment variables (`NODE_ENV === 'development'`, etc.)
 * - Localhost addresses (`localhost`, `127.0.0.1`, `::1`, `.local`, `.test`)
 * - AI Studio development deployments (`ais-dev-*.run.app`, etc.)
 * - Optional debug query parameter (`?dev=1` or `?build_info=1`)
 *
 * Returns false for:
 * - Shared preview deployments (`ais-pre-*.run.app`)
 * - Production deployments and custom domains in production mode
 */
export const isDevelopmentDeployment = (
  location?: DeploymentLocation | null,
  envOverride?: DeploymentEnv | null,
): boolean => {
  // If an explicit environment override is provided:
  if (envOverride) {
    if (envOverride.DEV === true) return true;
    if (
      envOverride.MODE === "development" ||
      envOverride.VITE_APP_ENV === "development" ||
      envOverride.APP_ENV === "development"
    ) {
      return true;
    }
    if (envOverride.NODE_ENV === "development") {
      return true;
    }
    if (
      envOverride.DEV === false ||
      envOverride.MODE === "production" ||
      envOverride.NODE_ENV === "production"
    ) {
      // If production environment was explicitly specified and no location was provided, not dev
      if (!location) return false;
    }
  }

  // 1. Check Vite build-time / runtime environment variables (if no override provided)
  if (!envOverride && typeof import.meta !== "undefined" && import.meta.env) {
    if (import.meta.env.DEV) return true;
    if (import.meta.env.MODE === "development") return true;
    if (import.meta.env.VITE_APP_ENV === "development") return true;
  }

  // 2. Check Node / process.env variables (if no override provided)
  if (!envOverride && typeof process !== "undefined" && process.env) {
    if (process.env.NODE_ENV === "development") return true;
    if (process.env.APP_ENV === "development") return true;
    if (process.env.VERCEL_ENV === "development") return true;
  }

  // 3. Check browser hostname & search params
  const loc: DeploymentLocation | null =
    location !== undefined
      ? location
      : typeof window !== "undefined" && window.location
        ? window.location
        : null;

  if (loc?.hostname) {
    const host = loc.hostname.toLowerCase();

    // Local development addresses
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".local") ||
      host.endsWith(".test") ||
      host.endsWith(".localhost")
    ) {
      return true;
    }

    // AI Studio development deployment URL pattern (e.g. ais-dev-pu3pqujtddceme4x44d6xb-21866646657.us-east1.run.app)
    if (
      host.startsWith("ais-dev-") ||
      host.includes(".ais-dev.") ||
      host.includes("-dev-") ||
      host.includes("dev.run.app")
    ) {
      return true;
    }

    // Explicit query parameter override for preview / debugging
    if (loc.search) {
      try {
        const params = new URLSearchParams(loc.search);
        if (params.get("dev") === "1" || params.get("build_info") === "1") {
          return true;
        }
      } catch {
        // Ignore URL parse error
      }
    }
  }

  // If running in test environment with no location specified, allow rendering for test assertions
  if (
    !envOverride &&
    typeof process !== "undefined" &&
    process.env?.NODE_ENV === "test" &&
    !loc
  ) {
    return true;
  }

  return false;
};
