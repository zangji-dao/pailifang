import { getDatabaseClient } from '@/storage/database/server-client';

export function createClient() {
  return getDatabaseClient();
}
