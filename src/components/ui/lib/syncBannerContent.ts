import {
  SYNC_WARNING_CLIENT_NETWORK,
  SYNC_WARNING_OUTBOX,
} from '../../../services/state/index.ts';

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
  tone: 'polite' | 'assertive';
  occurredAt: string;
}

interface SyncBannerInput {
  isBlocked?: boolean;
  label?: string;
}

const missingDatabasePattern =
  /DATABASE_URL is not configured|missing DATABASE_URL|VITE_DATABASE.*development/i;

const databaseFailurePattern =
  /Neon|Postgres|database|rate limit|HTTP (401|403|404|429)|could not be (loaded|saved)|Health check could not list shared state/i;

const buildDebugHints = ({ isBlocked, label }: SyncBannerInput): string[] => {
  if (isBlocked) {
    return [
      'Cause: remote sync conflict (local and shared edits diverged).',
      'Verify: reload the app and confirm both tabs show the latest shared state.',
      'Next step: retry sync after refresh.',
    ];
  }

  const text = label ?? '';

  if (text === SYNC_WARNING_OUTBOX || /waiting to sync to the server/i.test(text)) {
    return [
      'Cause: one or more changes are still queued for the server.',
      'Verify: stay online and use Retry sync, or wait for the next successful save.',
      'State: local edits are preserved until the queue clears.',
    ];
  }

  if (text === SYNC_WARNING_CLIENT_NETWORK || /Could not reach the app sync API/i.test(text)) {
    return [
      'Cause: this browser could not reach /api/state (dev server offline, wrong origin, or offline).',
      'Verify: run pnpm dev and open the app on the same origin; check the browser Network tab.',
      'State: showing cached local data until the API responds.',
    ];
  }

  if (missingDatabasePattern.test(text)) {
    return [
      'Cause: shared backend is not configured.',
      'Verify: set DATABASE_URL (server), or VITE_DATABASE_URL during local Vite, then restart dev server.',
      'State: writes are currently local-only until config is fixed.',
    ];
  }

  if (databaseFailurePattern.test(text)) {
    return [
      'Cause: the shared Postgres database rejected the request, the URL was wrong, or rate limits applied.',
      'Verify: DATABASE_URL points to the Neon pooled connection string; retry after cooldown.',
      'State: writes may be local-only until Neon accepts requests.',
    ];
  }

  if (/Neon|Postgres|shared state could not be loaded/i.test(text)) {
    return [
      'Cause: shared state uses Neon Postgres.',
      'Verify: environment variables, server logs, and https://status.neon.tech.',
      'State: writes are local-only until reads succeed.',
    ];
  }

  return [
    'Cause: shared state could not be synchronized.',
    'Verify: server logs, .env.local, and browser Network requests to /api/state.',
    'State: writes are currently local-only until sync recovers.',
  ];
};

const buildFriendlyContent = ({ isBlocked, label }: SyncBannerInput): Pick<SyncBannerContent, 'title' | 'description' | 'whatItMeans' | 'whatToDo'> => {
  if (isBlocked) {
    return {
      title: 'Sync conflict',
      description: 'A change from another device clashed with a local change.',
      whatItMeans: 'Nothing is lost — your local changes are still here.',
      whatToDo: 'Refresh the page, then hit Retry sync to resolve the conflict.',
    };
  }

  const text = label ?? '';

  if (text === SYNC_WARNING_OUTBOX || /waiting to sync to the server/i.test(text)) {
    return {
      title: 'Saving in background…',
      description: 'A recent change is still waiting to reach the shared backup.',
      whatItMeans: 'Everything is safe on this device right now.',
      whatToDo: 'Stay connected and it will sync automatically, or tap Retry sync to push it now.',
    };
  }

  if (text === SYNC_WARNING_CLIENT_NETWORK || /Could not reach the app sync API/i.test(text)) {
    return {
      title: 'Can\'t reach the server',
      description: 'The app couldn\'t connect to its sync service.',
      whatItMeans: 'You\'re seeing your last saved data. Any new changes stay local for now.',
      whatToDo: 'Check your connection, then tap Retry sync.',
    };
  }

  if (missingDatabasePattern.test(text)) {
    return {
      title: 'Shared backup not set up',
      description: 'The app is running without a shared storage backend.',
      whatItMeans: 'Changes only save on this device and won\'t appear for the other person.',
      whatToDo: 'Add DATABASE_URL to the environment to enable sharing.',
    };
  }

  if (databaseFailurePattern.test(text)) {
    return {
      title: 'Shared backup unavailable',
      description: 'The sync service declined the connection — possibly credentials or permissions.',
      whatItMeans: 'Your changes are safe locally. The other person may not see updates yet.',
      whatToDo: 'Tap Retry sync to try again. If it keeps failing, check the Neon database URL.',
    };
  }

  return {
    title: 'Sync paused',
    description: 'The shared backup couldn\'t be reached.',
    whatItMeans: 'Your changes are safe on this device for now.',
    whatToDo: 'Tap Retry sync to try again.',
  };
};

const buildCopyPayload = ({ isBlocked, label, occurredAt }: SyncBannerInput & { occurredAt: string }): string => {
  const text = label ?? '';
  const header = `[SYNC ERROR] ${occurredAt}`;
  const appCtx = `App: electron — shared movie night app (React + Vite frontend, serverless Node API)`;

  if (isBlocked) {
    return [
      header, appCtx, '',
      `Problem: sync conflict — local and remote edits diverged.`,
      `The app stores shared data (watchlist, messages, etc.) in Neon Postgres.`,
      `Two devices wrote conflicting changes at the same time.`,
      '', `Fix: reload the page, then retry sync.`,
      '', `Relevant file: api/_lib/sharedStateStore.ts`,
    ].join('\n');
  }

  if (databaseFailurePattern.test(text)) {
    return [
      header, appCtx, '',
      `Problem: Neon Postgres sync failed.`,
      `Raw error: ${text}`,
      '',
      `How sync works:`,
      `  The server reads/writes shared app data via Neon using DATABASE_URL.`,
      `  api/_lib/sharedStateStore.ts stores one JSON document per state scope.`,
      '',
      `Required env vars (set in .env.local or deploy secrets):`,
      `  DATABASE_URL — Neon pooled Postgres connection string`,
      '',
      `Likely causes:`,
      `  1. DATABASE_URL is missing or expired`,
      `  2. Connection string points at the wrong database`,
      `  3. Database limit hit — wait and retry`,
      '',
      `Relevant files:`,
      `  api/_lib/sharedStateStore.ts  — database read/write logic`,
      `  api/_lib/state.ts             — state scope handlers`,
      `  .env.local                    — where env vars should be defined`,
    ].join('\n');
  }

  if (text === SYNC_WARNING_CLIENT_NETWORK || /Could not reach the app sync API/i.test(text)) {
    return [
      header, appCtx, '',
      `Problem: frontend can't reach the sync API endpoint (/api/state).`,
      `Raw error: ${text}`,
      '',
      `How sync works:`,
      `  The React frontend polls GET /api/state/:scope and writes via POST mutate.`,
      `  These are serverless functions in the api/ directory.`,
      '',
      `Likely causes:`,
      `  1. Dev server not running (run: pnpm dev)`,
      `  2. Wrong origin — app must be served from the same host as the API`,
      `  3. Browser is offline`,
      '',
      `Relevant files:`,
      `  src/services/state/stateClient.ts  — fetch calls to /api/state`,
      `  api/state/[scope].ts               — API route entry point`,
    ].join('\n');
  }

  if (missingDatabasePattern.test(text)) {
    return [
      header, appCtx, '',
      `Problem: DATABASE_URL is missing — shared backend not configured.`,
      `Raw error: ${text}`,
      '',
      `Required env vars (set in .env.local or deploy secrets):`,
      `  DATABASE_URL — Neon pooled Postgres connection string`,
      '',
      `Without these, all writes are local-only and won't sync to the other person.`,
      '',
      `Relevant file: api/_lib/sharedStateStore.ts`,
    ].join('\n');
  }

  return [
    header, appCtx, '',
    `Problem: shared database sync failed.`,
    text ? `Raw error: ${text}` : `No additional error detail available.`,
    '',
    `The app syncs data via Neon Postgres (api/_lib/sharedStateStore.ts).`,
    `Check: DATABASE_URL, server logs, and network requests to /api/state.`,
  ].join('\n');
};

const formatTimestamp = (): string => {
  const now = new Date();
  return now.toLocaleString([], {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

export const getSyncBannerContent = ({
  isBlocked,
  label,
}: SyncBannerInput): SyncBannerContent => {
  const occurredAt = formatTimestamp();
  const friendly = buildFriendlyContent({ isBlocked, label });

  if (isBlocked) {
    return {
      badge: 'Action needed',
      ...friendly,
      debugHints: buildDebugHints({ isBlocked, label }),
      copyPayload: buildCopyPayload({ isBlocked, label, occurredAt }),
      accent: 'rgba(255, 189, 89, 0.16)',
      border: 'rgba(255, 189, 89, 0.45)',
      tone: 'assertive',
      occurredAt,
    };
  }

  return {
    badge: 'Sync paused',
    ...friendly,
    debugHints: buildDebugHints({ isBlocked, label }),
    copyPayload: buildCopyPayload({ isBlocked, label, occurredAt }),
    accent: 'rgba(255, 87, 87, 0.1)',
    border: 'rgba(255, 120, 120, 0.35)',
    tone: 'assertive',
    occurredAt,
  };
};
