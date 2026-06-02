/**
 * One-off Better Auth schema migration runner.
 *
 * Why a script instead of `@better-auth/cli migrate`: the CLI pulls in
 * `better-sqlite3` (a native module) which fails to build on Windows without
 * Visual Studio C++. We only use Postgres, so we call Better Auth's migration
 * API directly. `getMigrations` is not re-exported from the public `better-auth/db`
 * barrel, so we import it by file path.
 *
 * Run with: bun run scripts/migrate.mts   (Bun auto-loads .env.local)
 */
// Deep import — getMigrations is not re-exported from the public better-auth/db barrel.
import { getMigrations } from "../node_modules/better-auth/dist/db/get-migration.mjs";
import { authOptions } from "../lib/auth";

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(authOptions);

const tablesToCreate = toBeCreated.map((t: { table: string }) => t.table);
const tablesToAlter = toBeAdded.map((t: { table: string }) => t.table);

if (tablesToCreate.length === 0 && tablesToAlter.length === 0) {
  console.log("✓ Schema already up to date — nothing to migrate.");
  process.exit(0);
}

console.log("Creating tables:", tablesToCreate.length ? tablesToCreate.join(", ") : "(none)");
console.log("Altering tables:", tablesToAlter.length ? tablesToAlter.join(", ") : "(none)");

await runMigrations();
console.log("✓ Better Auth migrations applied.");
process.exit(0);
