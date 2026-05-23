import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

export const USERS = {
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  lowPerm: {
    username: process.env.LOW_PERM_USERNAME || 'low_perm',
    password: process.env.LOW_PERM_PASSWORD || 'test123',
  },
} as const;

export function getBaseURL(): string {
  return (process.env.BASE_URL || 'http://localhost')
    .replace(/#.*$/, '')
    .replace(/\/+$/, '');
}
