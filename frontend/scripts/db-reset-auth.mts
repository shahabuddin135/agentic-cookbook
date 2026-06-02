/**
 * One-off reset to align Better Auth tables with the canonical snake_case schema
 * (schema.dbml). Safe because every auth table is empty at this point.
 *
 *  - user: drop the duplicate camelCase columns Better Auth's first (camel) ALTER
 *    added, and rename the rest to snake_case. The backend's snake_case
 *    `created_at` stays. App-table FKs to user.id are untouched.
 *  - session/account/verification/jwks: drop so Better Auth recreates them in
 *    snake_case on the next migrate (also discards the stale EdDSA jwks key so a
 *    fresh RS256 key is generated).
 *
 * Run: bun run scripts/db-reset-auth.mts   (then: bun run scripts/migrate.mts)
 */
import { Pool } from "pg";

function norm(raw?: string) {
  return raw
    ?.replace(/^postgres(ql)?\+asyncpg:\/\//i, "postgresql://")
    .replace(/[?&]ssl(mode)?=[^&]*/gi, "")
    .replace(/\?$/, "");
}

const pool = new Pool({ connectionString: norm(process.env.DATABASE_URL), ssl: { rejectUnauthorized: false } });

const client = await pool.connect();
try {
  // Guard: only proceed if the auth tables are empty.
  const { rows } = await client.query(
    `select coalesce((select count(*) from "user"),0)::int as users,
            coalesce((select count(*) from session),0)::int as sessions,
            coalesce((select count(*) from account),0)::int as accounts`,
  );
  if (rows[0].users > 0 || rows[0].sessions > 0 || rows[0].accounts > 0) {
    console.error("ABORT: auth tables are not empty:", rows[0]);
    process.exit(1);
  }

  await client.query("BEGIN");

  // user → canonical snake_case (table is empty). Snake columns already exist;
  // drop the camelCase duplicates Better Auth re-added so only snake_case remains.
  await client.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "emailVerified"`);
  await client.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "createdAt"`);
  await client.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "updatedAt"`);

  // recreate the rest fresh in snake_case via the migrate step
  await client.query(`DROP TABLE IF EXISTS session CASCADE`);
  await client.query(`DROP TABLE IF EXISTS account CASCADE`);
  await client.query(`DROP TABLE IF EXISTS verification CASCADE`);
  await client.query(`DROP TABLE IF EXISTS jwks CASCADE`);

  await client.query("COMMIT");
  console.log("✓ Reset complete. user normalized to snake_case; session/account/verification/jwks dropped.");
} catch (e) {
  await client.query("ROLLBACK");
  console.error("Reset failed, rolled back:", e);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
process.exit(0);
