import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Next 16 renamed `middleware` → `proxy` (nodejs runtime only). Optimistic auth
// gate: redirect unauthenticated users away from protected routes and signed-in
// users away from the auth pages. The backend JWT verification is the real gate.
export async function proxy(request: NextRequest) {
  const session = getSessionCookie(request);

  const isProtected = ["/chat", "/profile"].some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );
  const isAuthPage = ["/sign-in", "/sign-up"].some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/profile/:path*", "/sign-in", "/sign-up"],
};
