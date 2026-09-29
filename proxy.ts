import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

// Next.js 16 Proxy runs in Node.js, required by JWT verification and Prisma.
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/team-official/signup") return NextResponse.next();
  const session = await getSession(request, true);
  if (session?.mustChangePassword && path !== "/change-password") return NextResponse.redirect(new URL("/change-password", request.url));
  if (path === "/change-password") return session ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url));
  const allowed = path.startsWith("/athlete") ? ["ATHLETE"]
    : path.startsWith("/club") ? ["CLUB"]
    : path.startsWith("/staff") ? ["STAFF", "ADMIN"]
    : path.startsWith("/admin") ? ["ADMIN"]
    : ["TEAM_OFFICIAL"];
  if (session && !allowed.includes(session.role)) return new NextResponse("ไม่มีสิทธิ์เข้าถึง", { status: 403 });
  if (!session) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (!session) { response.cookies.delete("token"); response.cookies.delete("role"); }
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/change-password", "/athlete/:path*", "/club/:path*", "/staff/:path*", "/admin/:path*", "/team-official/:path*"],
};
