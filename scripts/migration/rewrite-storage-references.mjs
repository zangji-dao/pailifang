import pg from 'pg';
import {
  databaseName,
  describeDatabase,
  loadEnvironmentFile,
  parseArgs,
  quoteIdentifier,
  requireValue,
  sslConfig,
} from './migration-utils.mjs';

const { Client } = pg;
const args = parseArgs();
loadEnvironmentFile(args);
const databaseUrl = requireValue(
  args.get('database', process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL),
  'TARGET_DATABASE_URL、DATABASE_URL 或 --database',
);
const sourcePrefix = requireValue(
  args.get('source-prefix', process.env.SOURCE_STORAGE_URL_PREFIX),
  'SOURCE_STORAGE_URL_PREFIX 或 --source-prefix',
);
const targetPrefix = requireValue(
  args.get('target-prefix', process.env.TARGET_STORAGE_URL_PREFIX),
  'TARGET_STORAGE_URL_PREFIX 或 --target-prefix',
);
const apply = args.has('apply');

if (apply) {
  const expected = databaseName(databaseUrl);
  if (args.get('confirm-target') !== expected) {
    throw new Error(`写入前请增加 --confirm-target ${expected}`);
  }
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: sslConfig('TARGET'),
});
await client.connect();

try {
  console.log(`${apply ? '重写' : '审计'}数据库: ${describeDatabase(databaseUrl)}`);
  const columns = await client.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type IN ('text', 'character varying', 'character', 'json', 'jsonb')
    ORDER BY table_name, ordinal_position
  `);
  const matches = [];

  if (apply) {
    await client.query('BEGIN');
  }

  try {
    for (const column of columns.rows) {
      const tableName = quoteIdentifier(column.table_name);
      const columnName = quoteIdentifier(column.column_name);
      const countResult = await client.query(
        `SELECT COUNT(*)::bigint AS count FROM ${tableName} WHERE strpos(${columnName}::text, $1) > 0`,
        [sourcePrefix],
      );
      const count = Number(countResult.rows[0].count);
      if (count === 0) {
        continue;
      }

      matches.push({
        table: column.table_name,
        column: column.column_name,
        dataType: column.data_type,
        count,
      });

      if (apply) {
        const cast = column.data_type === 'json' ? '::json' : column.data_type === 'jsonb' ? '::jsonb' : '';
        await client.query(
          `UPDATE ${tableName} SET ${columnName} = replace(${columnName}::text, $1, $2)${cast} WHERE strpos(${columnName}::text, $1) > 0`,
          [sourcePrefix, targetPrefix],
        );
      }
    }

    if (apply) {
      await client.query('COMMIT');
    }
  } catch (error) {
    if (apply) {
      await client.query('ROLLBACK');
    }
    throw error;
  }

  for (const match of matches) {
    console.log(`${match.table}.${match.column}: ${match.count}`);
  }
  console.log(`匹配列数: ${matches.length}`);
  console.log(apply ? '存储 URL 引用重写完成' : '当前为只读审计；确认后增加 --apply');
} finally {
  await client.end();
}
