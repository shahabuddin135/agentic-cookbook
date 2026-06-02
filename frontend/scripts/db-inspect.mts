/** Inspect current DB state (tables, user columns, row counts). Run: bun run scripts/db-inspect.mts */
import { Pool } from "pg";

function norm(raw?: string) {
  return raw
    ?.replace(/^postgres(ql)?\+asyncpg:\/\//i, "postgresql://")
    .replace(/[?&]ssl(mode)?=[^&]*/gi, "")
    .replace(/\?$/, "");
}

const pool = new Pool({ connectionString: norm(process.env.DATABASE_URL), ssl: { rejectUnauthorized: false } });

const tables = await pool.query(
  `select table_name from information_schema.tables where table_schema='public' order by table_name`,
);
console.log("TABLES:", tables.rows.map((r) => r.table_name).join(", ") || "(none)");

for (const t of ["user", "session", "account", "verification", "jwks"]) {
  const exists = tables.rows.some((r) => r.table_name === t);
  if (!exists) {
    console.log(`\n[${t}] — does not exist`);
    continue;
  }
  const cols = await pool.query(
    `select column_name, data_type, is_nullable from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position`,
    [t],
  );
  const count = await pool.query(`select count(*)::int as n from "${t}"`);
  console.log(`\n[${t}] rows=${count.rows[0].n}`);
  for (const c of cols.rows) console.log(`   ${c.column_name} : ${c.data_type} ${c.is_nullable === "NO" ? "NOT NULL" : "null"}`);
}

await pool.end();
process.exit(0);
