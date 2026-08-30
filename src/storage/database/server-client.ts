import { getPostgresClient } from './postgres-client';

function loadEnv(): void {}

const getDatabaseClient = getPostgresClient;

export { loadEnv, getDatabaseClient };
