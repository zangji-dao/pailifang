import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

export function parseArgs(argv = process.argv.slice(2)) {
  const values = new Map();
  const flags = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('--')) {
      continue;
    }

    const equalIndex = item.indexOf('=');
    if (equalIndex !== -1) {
      values.set(item.slice(2, equalIndex), item.slice(equalIndex + 1));
      continue;
    }

    const key = item.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      values.set(key, next);
      index += 1;
    } else {
      flags.add(key);
    }
  }

  return {
    get(key, fallback) {
      return values.get(key) ?? fallback;
    },
    has(key) {
      return flags.has(key) || values.has(key);
    },
  };
}

export function requireValue(value, label) {
  if (!value) {
    throw new Error(`缺少 ${label}`);
  }
  return value;
}

export function loadEnvironmentFile(args) {
  const configuredPath = args.get('env-file');
  const envFile = configuredPath || (existsSync('.env.migration') ? '.env.migration' : undefined);
  if (envFile) {
    const result = dotenv.config({ path: resolve(envFile), override: false });
    if (result.error) {
      throw result.error;
    }
  }
}

export function ensureParentDirectory(filePath) {
  mkdirSync(dirname(resolve(filePath)), { recursive: true });
}

export function commandExists(command) {
  const result = spawnSync(command, ['--version'], {
    stdio: 'ignore',
    shell: false,
  });
  return result.status === 0;
}

export function runCommand(command, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      ...options,
    });

    child.on('error', rejectPromise);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${command} 执行失败，退出码 ${code ?? signal}`));
    });
  });
}

export function databaseName(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return decodeURIComponent(parsed.pathname.replace(/^\//, ''));
}

export function describeDatabase(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return `${parsed.hostname}:${parsed.port || '5432'}/${databaseName(databaseUrl)}`;
}

export function dockerizeDatabaseUrl(databaseUrl) {
  const parsed = new URL(databaseUrl);
  if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
    parsed.hostname = 'host.docker.internal';
  }
  return parsed.toString();
}

export function quoteIdentifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`不安全的数据库标识符: ${value}`);
  }
  return `"${value}"`;
}

export function sslConfig(prefix) {
  const mode = process.env[`${prefix}_PG_SSL_MODE`] || process.env.PG_SSL_MODE || 'disable';
  if (mode === 'disable') {
    return false;
  }
  return {
    rejectUnauthorized: (process.env[`${prefix}_PG_SSL_REJECT_UNAUTHORIZED`]
      || process.env.PG_SSL_REJECT_UNAUTHORIZED) !== 'false',
  };
}
