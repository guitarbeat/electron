import {
  SYNC_WARNING_CLIENT_NETWORK,
  SYNC_WARNING_OUTBOX,
} from "../../../services/state/index.ts";

export interface SyncBannerContent {
  badge: string;
  title: string;
  description: string;
  whatItMeans: string;
  whatToDo: string;
  debugHints: string[];
  copyPayload: string;
  accent: string;
  border: string;
  tone: "polite" | "assertive";
  occurredAt: string;
}

interface SyncBannerInput {
  isBlocked?: boolean;
  label?: string;
}

type SyncBannerIssue =
  | "blocked"
  | "outbox"
  | "network"
  | "missing_database"
  | "database_failure"
  | "shared_state_load"
  | "generic";

const missingDatabasePattern =
  /DATABASE_URL is not configured|missing DATABASE_URL|VITE_DATABASE.*development/i;

const databaseFailurePattern =
  /Neon|Postgres|database|rate limit|HTTP (401|403|404|429)|could not be (loaded|saved)|Health check could not list shared state/i;

const sharedStateLoadPattern =
  /Neon|Postgres|shared state could not be loaded/i;

const isOutboxLabel = (text: string): boolean =>
  text === SYNC_WARNING_OUTBOX || /waiting to sync to the server/i.test(text);

const isNetworkLabel = (text: string): boolean =>
  text === SYNC_WARNING_CLIENT_NETWORK ||
  /Could not reach the app sync API|Saving on this device/i.test(text);

const classifySyncBannerIssue = ({
  isBlocked,
  label,
}: SyncBannerInput): SyncBannerIssue => {
  if (isBlocked) {
    return "blocked";
  }

  const text = label ?? "";

  if (isOutboxLabel(text)) {
    return "outbox";
  }

  if (isNetworkLabel(text)) {
    return "network";
  }

  if (missingDatabasePattern.test(text)) {
    return "missing_database";
  }

  if (databaseFailurePattern.test(text)) {
    return "database_failure";
  }

  if (sharedStateLoadPattern.test(text)) {
    return "shared_state_load";
  }

  return "generic";
};

/** Copy payloads use a different branch order than user-facing hints. */
const classifySyncBannerCopyIssue = ({
  isBlocked,
  label,
}: SyncBannerInput): SyncBannerIssue => {
  if (isBlocked) {
    return "blocked";
  }

  const text = label ?? "";

  if (databaseFailurePattern.test(text)) {
    return "database_failure";
  }

  if (isNetworkLabel(text)) {
    return "network";
  }

  if (missingDatabasePattern.test(text)) {
    return "missing_database";
  }

  return "generic";
};

const DEBUG_HINTS: Record<SyncBannerIssue, string[]> = {
  blocked: [
    "Cause: remote sync conflict (local and shared edits diverged).",
    "Verify: reload the app and confirm both tabs show the latest shared state.",
    "Next step: retry sync after refresh.",
  ],
  outbox: [
    "Cause: one or more changes are still queued for the server.",
    "Verify: stay online and use Retry sync, or wait for the next successful save.",
    "State: local edits are preserved until the queue clears.",
  ],
  network: [
    "Cause: this browser could not reach /api/state (dev server offline, wrong origin, or offline).",
    "Verify: run pnpm dev and open the URL printed in the terminal (not :5000 on macOS — AirPlay uses that port).",
    "State: showing cached local data until the API responds.",
  ],
  missing_database: [
    "Cause: shared backend is not configured.",
    "Verify: set DATABASE_URL (server), or VITE_DATABASE_URL during local Vite, then restart dev server.",
    "State: writes are currently local-only until config is fixed.",
  ],
  database_failure: [
    "Cause: the shared Postgres database rejected the request, the URL was wrong, or rate limits applied.",
    "Verify: DATABASE_URL points to the Neon pooled connection string; retry after cooldown.",
    "State: writes may be local-only until Neon accepts requests.",
  ],
  shared_state_load: [
    "Cause: shared state uses Neon Postgres.",
    "Verify: environment variables, server logs, and https://status.neon.tech.",
    "State: writes are local-only until reads succeed.",
  ],
  generic: [
    "Cause: shared state could not be synchronized.",
    "Verify: server logs, .env.local, and browser Network requests to /api/state.",
    "State: writes are currently local-only until sync recovers.",
  ],
};

const FRIENDLY_CONTENT: Record<
  SyncBannerIssue,
  Pick<SyncBannerContent, "title" | "description" | "whatItMeans" | "whatToDo">
> = {
  blocked: {
    title: "Sync conflict",
    description: "A change from another device clashed with a local change.",
    whatItMeans: "Nothing is lost — your local changes are still here.",
    whatToDo: "Refresh the page, then select Retry sync to resolve the conflict.",
  },
  outbox: {
    title: "Saving in background…",
    description: "A recent change is still waiting to reach the shared backup.",
    whatItMeans: "Everything is safe on this device right now.",
    whatToDo:
      "Stay connected and it will sync automatically, or select Retry sync to push it now.",
  },
  network: {
    title: "Saved on this device",
    description: "You're offline — changes stay here until you're back online.",
    whatItMeans: "Your watchlist and notes are safe locally.",
    whatToDo: "When you're online again, select Retry sync.",
  },
  missing_database: {
    title: "Shared backup not set up",
    description: "The app is running without a shared storage backend.",
    whatItMeans:
      "Changes only save on this device and won't appear for the other person.",
    whatToDo: "Add DATABASE_URL to the environment to enable sharing.",
  },
  database_failure: {
    title: "Shared backup unavailable",
    description:
      "The sync service declined the connection — possibly credentials or permissions.",
    whatItMeans:
      "Your changes are safe locally. The other person may not see updates yet.",
    whatToDo:
      "Select Retry sync to try again. If it keeps failing, check the Neon database URL.",
  },
  shared_state_load: {
    title: "Sync unavailable",
    description: "The shared backup couldn't be reached right now.",
    whatItMeans: "Your changes are safe on this device for now.",
    whatToDo: "Select Retry sync to try again.",
  },
  generic: {
    title: "Sync unavailable",
    description: "The shared backup couldn't be reached right now.",
    whatItMeans: "Your changes are safe on this device for now.",
    whatToDo: "Select Retry sync to try again.",
  },
};

const ISSUE_STYLING: Record<
  SyncBannerIssue,
  Pick<SyncBannerContent, "badge" | "accent" | "border" | "tone">
> = {
  blocked: {
    badge: "Action needed",
    accent: "rgba(255, 189, 89, 0.16)",
    border: "rgba(255, 189, 89, 0.45)",
    tone: "assertive",
  },
  outbox: {
    badge: "Saving…",
    accent: "rgba(255, 189, 89, 0.12)",
    border: "rgba(255, 189, 89, 0.32)",
    tone: "polite",
  },
  network: {
    badge: "Offline",
    accent: "rgba(125, 211, 252, 0.12)",
    border: "rgba(125, 211, 252, 0.28)",
    tone: "polite",
  },
  missing_database: {
    badge: "Local only",
    accent: "rgba(125, 211, 252, 0.1)",
    border: "rgba(125, 211, 252, 0.25)",
    tone: "polite",
  },
  database_failure: {
    badge: "Sync issue",
    accent: "rgba(255, 87, 87, 0.1)",
    border: "rgba(255, 120, 120, 0.35)",
    tone: "assertive",
  },
  shared_state_load: {
    badge: "Sync paused",
    accent: "rgba(255, 189, 89, 0.12)",
    border: "rgba(255, 189, 89, 0.32)",
    tone: "polite",
  },
  generic: {
    badge: "Sync paused",
    accent: "rgba(255, 189, 89, 0.12)",
    border: "rgba(255, 189, 89, 0.32)",
    tone: "polite",
  },
};

const formatTimestamp = (): string => {
  const now = new Date();
  return now.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const buildCopyPayload = ({
  issue,
  label,
  occurredAt,
}: SyncBannerInput & {
  issue: SyncBannerIssue;
  occurredAt: string;
}): string => {
  const text = label ?? "";
  const header = `[SYNC ERROR] ${occurredAt}`;
  const appCtx = `App: electron — shared movie night app (React + Vite frontend, serverless Node API)`;

  if (issue === "blocked") {
    return [
      header,
      appCtx,
      "",
      `Problem: sync conflict — local and remote edits diverged.`,
      `The app stores shared data (watchlist, messages, etc.) in Neon Postgres.`,
      `Two devices wrote conflicting changes at the same time.`,
      "",
      `Fix: reload the page, then retry sync.`,
      "",
      `Relevant file: api/_lib/sharedStateStore.ts`,
    ].join("\n");
  }

  if (issue === "database_failure") {
    return [
      header,
      appCtx,
      "",
      `Problem: Neon Postgres sync failed.`,
      `Raw error: ${text}`,
      "",
      `How sync works:`,
      `  The server reads/writes shared app data via Neon using DATABASE_URL.`,
      `  api/_lib/sharedStateStore.ts stores one JSON document per state scope.`,
      "",
      `Required env vars (set in .env.local or deploy secrets):`,
      `  DATABASE_URL — Neon pooled Postgres connection string`,
      "",
      `Likely causes:`,
      `  1. DATABASE_URL is missing or expired`,
      `  2. Connection string points at the wrong database`,
      `  3. Database limit hit — wait and retry`,
      "",
      `Relevant files:`,
      `  api/_lib/sharedStateStore.ts  — database read/write logic`,
      `  api/_lib/state.ts             — state scope handlers`,
      `  .env.local                    — where env vars should be defined`,
    ].join("\n");
  }

  if (issue === "network") {
    return [
      header,
      appCtx,
      "",
      `Problem: frontend can't reach the sync API endpoint (/api/state).`,
      `Raw error: ${text}`,
      "",
      `How sync works:`,
      `  The React frontend polls GET /api/state/:scope and writes via POST mutate.`,
      `  These are serverless functions in the api/ directory.`,
      "",
      `Likely causes:`,
      `  1. Dev server not running (run: pnpm dev)`,
      `  2. Wrong origin — app must be served from the same host as the API`,
      `  3. Browser is offline`,
      "",
      `Relevant files:`,
      `  src/services/state/stateClient.ts  — fetch calls to /api/state`,
      `  api/state/[scope].ts               — API route entry point`,
    ].join("\n");
  }

  if (issue === "missing_database") {
    return [
      header,
      appCtx,
      "",
      `Problem: DATABASE_URL is missing — shared backend not configured.`,
      `Raw error: ${text}`,
      "",
      `Required env vars (set in .env.local or deploy secrets):`,
      `  DATABASE_URL — Neon pooled Postgres connection string`,
      "",
      `Without these, all writes are local-only and won't sync to the other person.`,
      "",
      `Relevant file: api/_lib/sharedStateStore.ts`,
    ].join("\n");
  }

  return [
    header,
    appCtx,
    "",
    `Problem: shared database sync failed.`,
    text ? `Raw error: ${text}` : `No additional error detail available.`,
    "",
    `The app syncs data via Neon Postgres (api/_lib/sharedStateStore.ts).`,
    `Check: DATABASE_URL, server logs, and network requests to /api/state.`,
  ].join("\n");
};

const isDevBuild = (): boolean => {
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    "DEV" in import.meta.env
  ) {
    return Boolean(import.meta.env.DEV);
  }

  return process.env.NODE_ENV !== "production";
};

export const shouldShowSyncBanner = ({
  isBlocked,
  label,
}: SyncBannerInput): boolean => {
  if (isBlocked) {
    return true;
  }

  const issue = classifySyncBannerIssue({ isBlocked, label });

  if (issue === "missing_database") {
    return false;
  }

  if (issue === "network" && isDevBuild()) {
    return false;
  }

  return true;
};

export const getSyncBannerContent = ({
  isBlocked,
  label,
}: SyncBannerInput): SyncBannerContent => {
  const occurredAt = formatTimestamp();
  const issue = classifySyncBannerIssue({ isBlocked, label });
  const copyIssue = classifySyncBannerCopyIssue({ isBlocked, label });

  return {
    ...ISSUE_STYLING[issue],
    ...FRIENDLY_CONTENT[issue],
    debugHints: DEBUG_HINTS[issue],
    copyPayload: buildCopyPayload({
      issue: copyIssue,
      isBlocked,
      label,
      occurredAt,
    }),
    occurredAt,
  };
};
