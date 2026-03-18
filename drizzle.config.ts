import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/storage/database/shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.PG_HOST || '152.136.12.122',
    port: Number(process.env.PG_PORT) || 5432,
    user: process.env.PG_USER || 'pi_user',
    password: process.env.PG_PASSWORD || 'PiCube2024',
    database: process.env.PG_DATABASE || 'pi_cube',
    ssl: false,
  },
});
