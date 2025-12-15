import { config } from 'dotenv';
config(); // Load .env.local

import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'mysql',
  dbCredentials: {
  url: 'mysql://root:RzqsDDIytRfMwUksIsHHgGgRtecJJMSf@trolley.proxy.rlwy.net:24264/railway' },
} satisfies Config;
