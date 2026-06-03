import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export const runtime = "nodejs";

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
