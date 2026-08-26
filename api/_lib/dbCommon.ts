import pg from "pg";

const { Pool } = pg;

export const cleanEnvValue = (value: string | undefined): string => {
  let normalized = (value || "").trim();

  while (
    normalized.length >= 2 &&
    ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized;
};

export const getDatabaseUrl = (): string =>
  cleanEnvValue(
    process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL,
    // NOTE: VITE_DATABASE_URL is intentionally excluded here. VITE_* variables
    // are bundled into the client-side JavaScript by Vite, which would expose
    // the connection string to every browser. Use DATABASE_URL (server-only).
  );

export const needsSsl = (url: string): boolean => {
  try {
    const u = new URL(url);
    const sslmode = u.searchParams.get("sslmode");
    if (sslmode === "disable" || sslmode === "allow") return false;
    // Neon, Supabase, Railway, and most cloud Postgres hosts require SSL.
    const cloudHosts = [
      "neon.tech",
      "supabase.co",
      "railway.app",
      "render.com",
      "amazonaws.com",
    ];
    return cloudHosts.some((h) => u.hostname.includes(h));
  } catch {
    return false;
  }
};

export const cleanDatabaseUrl = (url: string): string => {
  try {
    const u = new URL(url);
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return url;
  }
};

export const createPostgresPool = (databaseUrl: string): pg.Pool => {
  const cleanUrl = cleanDatabaseUrl(databaseUrl);
  const poolConfig: pg.PoolConfig = { connectionString: cleanUrl };
  if (needsSsl(cleanUrl)) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
  return new Pool(poolConfig);
};
