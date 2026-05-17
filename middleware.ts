import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("role")?.value;

  if (pathname.startsWith("/athlete") && role !== "athlete") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/club") && role !== "club") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/athlete/:path*", "/club/:path*"],
};