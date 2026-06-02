import { betterAuth, type BetterAuthOptions } from "better-auth";
import { jwt } from "better-auth/plugins";
import { Pool } from "pg";

/**
 * Better Auth server — hosted inside this Next.js app.
 *
 * It owns the Neon `user`/`session`/`account`/`verification`/`jwks` tables and
 * serves a JWKS endpoint (/api/auth/jwks) that the FastAPI backend fetches to
 * verify the RS256 JWTs minted by the jwt() plugin.
 *
 * Frozen decisions (spec/MEMORY.md, schema.dbml):
 *  - email + password only; accounts active immediately (no email verification)
 *  - JWT algorithm RS256; audience claim intentionally NOT configured
 *    (backend verifies with verify_aud: False)
 *  - ALL columns are snake_case to match schema.dbml and the FastAPI read models.
 *    Better Auth defaults to camelCase columns and its `casing` option only
 *    affects table names, so each model's columns are mapped explicitly via
 *    `fields` (and the jwt plugin's `schema`).
 *
 * BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from the environment.
 */

/**
 * Normalize the Neon connection string for the node-postgres (`pg`) driver.
 *
 * The same Neon database is referenced by the FastAPI backend using the
 * SQLAlchemy/asyncpg URL form (`postgresql+asyncpg://...?ssl=require`). The `pg`
 * driver does not understand the `+asyncpg` dialect suffix nor the `ssl=require`
 * query param, so we strip them and enforce TLS via the Pool `ssl` option
 * instead (Neon requires SSL).
 */
function neonConnectionString(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  return raw
    .replace(/^postgres(ql)?\+asyncpg:\/\//i, "postgresql://")
    .replace(/[?&]ssl(mode)?=[^&]*/gi, "")
    .replace(/\?$/, "");
}

const pool = new Pool({
  connectionString: neonConnectionString(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: false },
});

// Exported separately so the migration script (scripts/migrate.mts) can run
// Better Auth's schema migrations against the same config without duplicating it.
export const authOptions = {
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  // snake_case column mappings (camelCase field -> snake_case DB column).
  user: {
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  session: {
    fields: {
      userId: "user_id",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  account: {
    fields: {
      userId: "user_id",
      accountId: "account_id",
      providerId: "provider_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  plugins: [
    // RS256 (CONSTRAINTS + MEMORY) — Better Auth defaults to EdDSA. No audience set.
    jwt({
      jwks: { keyPairConfig: { alg: "RS256", modulusLength: 2048 } },
      schema: {
        jwks: {
          fields: {
            publicKey: "public_key",
            privateKey: "private_key",
            createdAt: "created_at",
            expiresAt: "expires_at",
          },
        },
      },
    }),
  ],
} satisfies BetterAuthOptions;

export const auth = betterAuth(authOptions);
