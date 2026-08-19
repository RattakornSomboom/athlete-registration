import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ดึง role จาก cookie ที่ set ไว้ตอน login
  const role = request.cookies.get("role")?.value || null;

  // Guard routes ตาม role
  if (pathname.startsWith("/athlete") && role !== "athlete") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/club") && role !== "club") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/staff") && role !== "staff") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/team-official") && role !== "team_official") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/athlete/:path*",
    "/club/:path*",
    "/staff/:path*",
    "/admin/:path*",
    "/team-official/:path*",
  ],
};