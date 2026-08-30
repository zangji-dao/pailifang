import { basename, dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import {
  commandExists,
  databaseName,
  describeDatabase,
  dockerizeDatabaseUrl,
  ensureParentDirectory,
  loadEnvironmentFile,
  parseArgs,
  requireValue,
  runCommand,
} from './migration-utils.mjs';

const args = parseArgs();
loadEnvironmentFile(args);
const dumpOnly = args.has('dump-only');
const restoreOnly = args.has('restore-only');

if (dumpOnly && restoreOnly) {
  throw new Error('--dump-only 与 --restore-only 不能同时使用');
}

const sourceUrl = args.get('source', process.env.SOURCE_DATABASE_URL);
const targetUrl = args.get('target', process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const dumpFile = resolve(args.get('dump-file', `migration-artifacts/pi-cube-${timestamp}.dump`));
const image = args.get('image', process.env.POSTGRES_TOOL_IMAGE || 'postgres:16-alpine');
const requiresDump = !restoreOnly;
const requiresRestore = !dumpOnly;
const localToolsAvailable = (!requiresDump || commandExists('pg_dump'))
  && (!requiresRestore || commandExists('pg_restore'));
const useDocker = args.has('docker') || !localToolsAvailable;

if (!restoreOnly) {
  requireValue(sourceUrl, 'SOURCE_DATABASE_URL 或 --source');
}
if (!dumpOnly) {
  requireValue(targetUrl, 'TARGET_DATABASE_URL、DATABASE_URL 或 --target');
  const confirmation = args.get('confirm-target');
  const expected = databaseName(targetUrl);
  if (confirmation !== expected) {
    throw new Error(`恢复会清理目标数据库，请增加 --confirm-target ${expected}`);
  }
}
if (sourceUrl && targetUrl && sourceUrl === targetUrl) {
  throw new Error('源数据库与目标数据库不能相同');
}
if (restoreOnly && !existsSync(dumpFile)) {
  throw new Error(`备份文件不存在: ${dumpFile}`);
}
if (useDocker && !commandExists('docker')) {
  throw new Error('未找到 pg_dump/pg_restore，也未找到 Docker；请安装 PostgreSQL 客户端或 Docker Desktop');
}

ensureParentDirectory(dumpFile);

async function runLocal(tool, toolArgs) {
  await runCommand(tool, toolArgs);
}

async function runDocker(tool, toolArgs) {
  const mountDirectory = dirname(dumpFile);
  const mappedArgs = toolArgs.map((item) => {
    if (item === dumpFile) {
      return `/backup/${basename(dumpFile)}`;
    }
    if (item === sourceUrl || item === targetUrl) {
      return dockerizeDatabaseUrl(item);
    }
    return item;
  });
  await runCommand('docker', [
    'run',
    '--rm',
    '-v',
    `${mountDirectory}:/backup`,
    image,
    tool,
    ...mappedArgs,
  ]);
}

const run = useDocker ? runDocker : runLocal;

if (!restoreOnly) {
  console.log(`导出源数据库: ${describeDatabase(sourceUrl)}`);
  const schemaArguments = args.has('all-schemas') ? [] : ['--schema=public'];
  await run('pg_dump', [
    '--format=custom',
    '--no-owner',
    '--no-privileges',
    '--verbose',
    ...schemaArguments,
    '--file',
    dumpFile,
    sourceUrl,
  ]);
  console.log(`数据库备份已生成: ${dumpFile}`);
}

if (!dumpOnly) {
  console.log(`恢复到目标数据库: ${describeDatabase(targetUrl)}`);
  await run('pg_restore', [
    '--clean',
    '--if-exists',
    '--exit-on-error',
    '--no-owner',
    '--no-privileges',
    '--verbose',
    '--dbname',
    targetUrl,
    dumpFile,
  ]);
  console.log('数据库恢复完成');
}
