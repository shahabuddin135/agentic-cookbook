import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Catch-all Better Auth server handler: sign-in/up, session, JWKS, token, etc.
export const { GET, POST } = toNextJsHandler(auth);
