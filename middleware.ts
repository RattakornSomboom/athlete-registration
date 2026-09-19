import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/team-official/signup") return NextResponse.next();

  // Verify JWT token from cookie
  const token = request.cookies.get("token")?.value;
  let role: string | null = null;

  if (token) {
    try {
      const payload = verifyToken(token);
      role = payload.role;
    } catch {
      // Token invalid or expired -- clear cookie and redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }
  }

  if (pathname.startsWith("/athlete") && role !== "ATHLETE" && role !== "SUPERADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/club") && role !== "CLUB" && role !== "SUPERADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/staff") && role !== "STAFF" && role !== "SUPERADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "SUPERADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/team-official") && role !== "TEAM_OFFICIAL" && role !== "SUPERADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/athlete/:path*", "/club/:path*", "/staff/:path*", "/admin/:path*", "/team-official/:path*"],
};
