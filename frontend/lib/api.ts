import { authClient } from "@/lib/auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

/**
 * Fetch the RS256 JWT minted by Better Auth's jwt() plugin — this is the token
 * the FastAPI backend verifies against JWKS.
 *
 * IMPORTANT: this is NOT the opaque Better Auth session token (`session.token`).
 * The backend cannot verify the session token; it only accepts the RS256 JWT
 * served at /api/auth/token. The session cookie (sent automatically, same-origin)
 * authenticates this request.
 */
export async function getBackendJwt(): Promise<string | null> {
  const { data } = await authClient.$fetch<{ token: string }>("/token");
  return data?.token ?? null;
}

/**
 * Authenticated fetch wrapper for the FastAPI backend.
 * Automatically injects the RS256 JWT Bearer token from Better Auth.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getBackendJwt();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}

/**
 * Convenience: GET + parse JSON
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

/**
 * Convenience: POST + parse JSON
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

/**
 * Convenience: PUT + parse JSON
 */
export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

/**
 * Convenience: DELETE
 */
export async function apiDelete(path: string): Promise<void> {
  const res = await apiFetch(path, { method: "DELETE" });
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
}
