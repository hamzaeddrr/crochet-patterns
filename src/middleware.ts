import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { ADMIN_COOKIE, isAdminSessionValid } from "./lib/admin/auth-edge";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!(await isAdminSessionValid(token))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/login") {
      return NextResponse.next();
    }
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!(await isAdminSessionValid(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/",
    "/(en|fr|es)/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
