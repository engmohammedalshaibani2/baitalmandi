import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Dynamic import to ensure dotenv.config() runs first
async function run() {
  const { db } = await import('./src/db');
  const { sql } = await import('drizzle-orm');

  try {
    const policies = await db.execute(sql`
      SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
    `);
    console.log("RLS Policies in Database:");
    console.log(JSON.stringify(policies, null, 2));

    const rlsStatus = await db.execute(sql`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
    `);
    console.log("\nRLS Status per Table:");
    console.log(JSON.stringify(rlsStatus, null, 2));
  } catch (error) {
    console.error("Error fetching policies:", error);
  }
  process.exit(0);
}

run();
