import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("role")?.value;

  // ยกเว้นหน้าลงทะเบียนของผู้ใช้งานใหม่ให้เข้าถึงได้โดยไม่ต้องมี cookie role ล่วงหน้า
  if (pathname === "/team-official/register") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/athlete") && role !== "athlete") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/team-official") && role !== "team_official") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/club") && role !== "club") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/athlete/:path*", "/team-official/:path*", "/club/:path*"],
};