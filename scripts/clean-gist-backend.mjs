import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { normalizeMovies } from '../src/services/movieRecords.ts';
import {
  cloneQuizData,
  defaultQuizData,
  normalizeDailySpinRecord,
  normalizeMatchmakerGame,
  normalizeMemories,
  normalizeMessageRecord,
  normalizePlaces,
  normalizeQuizData,
  normalizeSpinHistoryParsed,
  normalizeStoredPins,
  normalizeSuggestions,
} from '../src/services/stateSchemas.ts';

const usage = `Usage: node scripts/clean-gist-backend.mjs [--write] [--env .env.local]

Normalizes the live GitHub Gist backend into the app's current schema.

Options:
  --write       Apply the cleanup to the configured Gist.
  --env <path>  Read env vars from a specific file. Defaults to .env.local.
`;

const parseArgs = (argv) => {
  const options = {
    write: false,
    envPath: '.env.local',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--write') {
      options.write = true;
      continue;
    }

    if (arg === '--env') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error('Expected a path after --env');
      }
      options.envPath = next;
      index += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(usage);
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const cleanEnvValue = (value) => value.trim().replace(/^['"]+|['"]+$/g, '');

const loadEnvFile = (envPath) => {
  const resolved = path.resolve(envPath);
  const env = {};

  if (!fs.existsSync(resolved)) {
    return env;
  }

  for (const line of fs.readFileSync(resolved, 'utf8').split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1);
    env[key] = cleanEnvValue(rawValue);
  }

  return env;
};

const resolveEnv = (envPath) => {
  const loaded = loadEnvFile(envPath);
  return {
    ...loaded,
    ...Object.fromEntries(
      Object.entries(process.env).filter(
        ([, value]) => typeof value === 'string' && value.trim().length > 0
      )
    ),
  };
};

const normalizeGistId = (value) =>
  cleanEnvValue(value || '')
    .replace(/^https:\/\/gist\.github\.com\/[^/]+\//, '')
    .replace(/^https:\/\/api\.github\.com\/gists\//, '');

const readMessages = (value) =>
  Array.isArray(value)
    ? value.flatMap((entry) => {
        const normalized = normalizeMessageRecord(entry);
        return normalized ? [normalized] : [];
      })
    : [];

const scopeCleaners = {
  'movielist.json': {
    normalize: (value) => (Array.isArray(value) ? normalizeMovies(value) : []),
    serialize: (value) => JSON.stringify(value, null, 2),
  },
  'messages.json': {
    normalize: readMessages,
    serialize: (value) => JSON.stringify(value, null, 2),
  },
  'memories.json': {
    normalize: normalizeMemories,
    serialize: (value) => JSON.stringify(value, null, 2),
  },
  'suggestions.json': {
    normalize: normalizeSuggestions,
    serialize: (value) => JSON.stringify(value, null, 2),
  },
  'places.json': {
    normalize: normalizePlaces,
    serialize: (value) => JSON.stringify(value, null, 2),
  },
  'quiz.json': {
    normalize: (value) => normalizeQuizData(value) ?? cloneQuizData(defaultQuizData),
    serialize: (value) => JSON.stringify(value, null, 2),
  },
  'matchmaker.json': {
    normalize: normalizeMatchmakerGame,
    serialize: (value) => (value === null ? 'null' : JSON.stringify(value, null, 2)),
  },
  'pins.json': {
    normalize: normalizeStoredPins,
    serialize: (value) => JSON.stringify(value, null, 2),
  },
  'spinhistory.json': {
    normalize: normalizeSpinHistoryParsed,
    serialize: (value) => JSON.stringify(value, null, 2),
  },
  'dailyspin.json': {
    normalize: normalizeDailySpinRecord,
    serialize: (value) => (value === null ? 'null' : JSON.stringify(value, null, 2)),
  },
};

const runGhApi = (args, input) => {
  const result = spawnSync('gh', ['api', ...args], {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    throw new Error(stderr || 'gh api request failed.');
  }

  return JSON.parse(result.stdout || '{}');
};

const fetchGist = async (gistId, token) => {
  if (!token) {
    return runGhApi([`/gists/${gistId}`]);
  }

  const response = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'codex',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to read gist (${response.status}).`);
  }

  return response.json();
};

const patchGist = async (gistId, token, files) => {
  const body = JSON.stringify({ files });

  if (!token) {
    return runGhApi(['--method', 'PATCH', `/gists/${gistId}`, '--input', '-'], body);
  }

  const response = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'codex',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to update gist (${response.status}).`);
  }

  return response.json();
};

const summarizeCount = (value) =>
  Array.isArray(value) ? value.length : value === null ? 0 : value && typeof value === 'object' ? 1 : 0;

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const env = resolveEnv(options.envPath);
  const gistId = normalizeGistId(env.GIST_ID || env.VITE_GIST_ID || '');
  const token = cleanEnvValue(env.GITHUB_TOKEN || env.GH_TOKEN || env.GITHUB_PAT || '');

  if (!gistId) {
    throw new Error(`No GIST_ID or VITE_GIST_ID found in ${options.envPath}.`);
  }

  const gist = await fetchGist(gistId, token);
  const changedFiles = [];
  const patch = {};

  for (const [filename, cleaner] of Object.entries(scopeCleaners)) {
    const file = gist.files?.[filename];
    if (!file || typeof file.content !== 'string') {
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(file.content);
    } catch (error) {
      console.warn(`Skipping ${filename}: invalid JSON.`);
      continue;
    }

    const normalized = cleaner.normalize(parsed);
    const currentSerialized = JSON.stringify(parsed);
    const nextSerialized = JSON.stringify(normalized);

    if (currentSerialized === nextSerialized) {
      continue;
    }

    changedFiles.push({
      filename,
      currentCount: summarizeCount(parsed),
      nextCount: summarizeCount(normalized),
    });
    patch[filename] = {
      content: cleaner.serialize(normalized),
    };
  }

  if (changedFiles.length === 0) {
    console.log(
      JSON.stringify(
        {
          gistId,
          dryRun: !options.write,
          changedFiles: [],
        },
        null,
        2
      )
    );
    return;
  }

  console.log(
    JSON.stringify(
      {
        gistId,
        dryRun: !options.write,
        changedFiles,
      },
      null,
      2
    )
  );

  if (!options.write) {
    return;
  }

  await patchGist(gistId, token, patch);
  console.log(`Applied cleanup to ${changedFiles.length} gist file(s).`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
