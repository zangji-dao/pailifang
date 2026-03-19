import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: '152.136.12.122',
    port: 5432,
    user: 'pi_user',
    password: 'PiCube2024',
    database: 'pi_cube',
    ssl: false,
  },
});
