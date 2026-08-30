import { Pool, type PoolConfig } from 'pg';

let pool: Pool | null = null;

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value === 'true' || value === '1';
}

function getSslConfig(): PoolConfig['ssl'] {
  let urlMode: string | null = null;
  if (process.env.DATABASE_URL) {
    urlMode = new URL(process.env.DATABASE_URL).searchParams.get('sslmode');
  }
  const mode = process.env.PG_SSL_MODE || process.env.PGSSLMODE || urlMode || 'disable';

  if (mode === 'disable') {
    return false;
  }

  return {
    rejectUnauthorized: parseBoolean(
      process.env.PG_SSL_REJECT_UNAUTHORIZED,
      mode !== 'no-verify',
    ),
  };
}

function getPoolConfig(): PoolConfig {
  const common: PoolConfig = {
    max: Number.parseInt(process.env.PG_POOL_MAX || '20', 10),
    idleTimeoutMillis: Number.parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10),
    connectionTimeoutMillis: Number.parseInt(process.env.PG_CONNECT_TIMEOUT_MS || '10000', 10),
    ssl: getSslConfig(),
  };

  if (process.env.DATABASE_URL) {
    return {
      ...common,
      connectionString: process.env.DATABASE_URL,
    };
  }

  const host = process.env.PG_HOST;
  const user = process.env.PG_USER;
  const database = process.env.PG_DATABASE;

  if (!host || !user || !database) {
    throw new Error(
      '数据库配置缺失，请设置 DATABASE_URL，或设置 PG_HOST、PG_USER、PG_DATABASE',
    );
  }

  return {
    ...common,
    host,
    port: Number.parseInt(process.env.PG_PORT || '5432', 10),
    user,
    password: process.env.PG_PASSWORD,
    database,
  };
}

export function getPostgresPool(): Pool {
  if (!pool) {
    pool = new Pool(getPoolConfig());
  }

  return pool;
}

export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
