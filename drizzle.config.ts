import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // استخدام Direct connection للـ Migrations (تجنب مشاكل Transaction pooler مع DDL)
    url: process.env.DIRECT_URL!,
  },
});
