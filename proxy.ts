import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

// Next.js 16 Proxy runs in Node.js, required by JWT verification and Prisma.
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/team-official/signup") return NextResponse.next();
  const session = await getSession(request);
  const allowed = path.startsWith("/athlete") ? ["ATHLETE", "SUPERADMIN"]
    : path.startsWith("/club") ? ["CLUB", "SUPERADMIN"]
    : path.startsWith("/staff") ? ["STAFF", "ADMIN", "SUPERADMIN"]
    : path.startsWith("/admin") ? ["ADMIN", "SUPERADMIN"]
    : ["TEAM_OFFICIAL", "SUPERADMIN"];
  if (!session || !allowed.includes(session.role)) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (!session) { response.cookies.delete("token"); response.cookies.delete("role"); }
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/athlete/:path*", "/club/:path*", "/staff/:path*", "/admin/:path*", "/team-official/:path*"],
};
