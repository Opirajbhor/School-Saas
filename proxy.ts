import { NextResponse, type NextRequest } from "next/server";

// Central gate for the private areas of the app. Every page used to guard
// itself, so a new page that forgot AccessServer was public by default — which
// is how /super-admin ended up exposed and how /print served published results
// to anonymous visitors. This runs before any of them.
//
// It only checks that a session cookie is present: the docs recommend against
// making API or database calls here. The per-page AccessServer checks stay as
// the real authorisation layer, so this is a first line, not the only one.
const SESSION_COOKIE_PREFIXES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

export function proxy(request: NextRequest) {
  const hasSession = request.cookies
    .getAll()
    .some((cookie) =>
      SESSION_COOKIE_PREFIXES.some(
        (name) => cookie.name === name || cookie.name.startsWith(`${name}.`),
      ),
    );

  if (hasSession) return NextResponse.next();

  const next = request.nextUrl.pathname;
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

// The matcher is the single source of truth for which routes are private, so
// there is no second list to keep in sync. /auth and the public marketing pages
// are deliberately absent: the onboarding flow lives under /auth, and gating it
// would bounce a signed-out user between the guard and the login form forever.
export const config = {
  matcher: ["/dashboard/:path*", "/super-admin/:path*", "/print/:path*"],
};
