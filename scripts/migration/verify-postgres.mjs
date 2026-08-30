import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';
import {
  describeDatabase,
  ensureParentDirectory,
  loadEnvironmentFile,
  parseArgs,
  quoteIdentifier,
  requireValue,
  sslConfig,
} from './migration-utils.mjs';

const { Client } = pg;
const args = parseArgs();
loadEnvironmentFile(args);
const sourceUrl = requireValue(
  args.get('source', process.env.SOURCE_DATABASE_URL),
  'SOURCE_DATABASE_URL 或 --source',
);
const targetUrl = requireValue(
  args.get('target', process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL),
  'TARGET_DATABASE_URL、DATABASE_URL 或 --target',
);
const reportFile = resolve(args.get('report', 'migration-artifacts/database-verification.json'));

async function connect(databaseUrl, prefix) {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: sslConfig(prefix),
  });
  await client.connect();
  return client;
}

async function tableCounts(client) {
  const tables = await client.query(`
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  const counts = {};
  for (const { tablename } of tables.rows) {
    const result = await client.query(`SELECT COUNT(*)::bigint AS count FROM ${quoteIdentifier(tablename)}`);
    counts[tablename] = Number(result.rows[0].count);
  }
  return counts;
}

const source = await connect(sourceUrl, 'SOURCE');
const target = await connect(targetUrl, 'TARGET');

try {
  console.log(`校验源数据库: ${describeDatabase(sourceUrl)}`);
  console.log(`校验目标数据库: ${describeDatabase(targetUrl)}`);
  const [sourceCounts, targetCounts] = await Promise.all([
    tableCounts(source),
    tableCounts(target),
  ]);
  const tableNames = Array.from(new Set([
    ...Object.keys(sourceCounts),
    ...Object.keys(targetCounts),
  ])).sort();
  const mismatches = tableNames.flatMap((table) => {
    const sourceCount = sourceCounts[table];
    const targetCount = targetCounts[table];
    return sourceCount === targetCount ? [] : [{ table, sourceCount, targetCount }];
  });
  const report = {
    generatedAt: new Date().toISOString(),
    source: describeDatabase(sourceUrl),
    target: describeDatabase(targetUrl),
    sourceCounts,
    targetCounts,
    mismatches,
  };
  ensureParentDirectory(reportFile);
  writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`数据库表数: ${tableNames.length}`);
  console.log(`不一致表数: ${mismatches.length}`);
  console.log(`校验报告: ${reportFile}`);
  if (mismatches.length > 0) {
    for (const mismatch of mismatches) {
      console.error(`${mismatch.table}: ${mismatch.sourceCount ?? '缺失'} -> ${mismatch.targetCount ?? '缺失'}`);
    }
    process.exitCode = 1;
  }
} finally {
  await Promise.all([source.end(), target.end()]);
}
