import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const { db } = await import('./src/db');
  const { sql } = await import('drizzle-orm');

  try {
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '0017_security_rls_fixes.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log("Running migration 0017_security_rls_fixes.sql...");
    
    // Split queries by semicolon to execute them one by one if needed, or execute as a block
    // Since it's a standard script, executing as a block is generally fine in pg.
    await db.execute(sql.raw(sqlContent));
    
    console.log("Migration executed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

run();
