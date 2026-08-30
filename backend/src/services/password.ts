import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const PASSWORD_PREFIX = 'scrypt';
const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${PASSWORD_PREFIX}$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, storedPassword: string) {
  const [prefix, salt, storedKey] = storedPassword.split('$');

  if (prefix !== PASSWORD_PREFIX || !salt || !storedKey) {
    return {
      valid: storedPassword === password,
      needsUpgrade: storedPassword === password,
    };
  }

  const suppliedKey = scryptSync(password, salt, KEY_LENGTH);
  const storedKeyBuffer = Buffer.from(storedKey, 'hex');
  const valid = storedKeyBuffer.length === suppliedKey.length && timingSafeEqual(storedKeyBuffer, suppliedKey);

  return { valid, needsUpgrade: false };
}
