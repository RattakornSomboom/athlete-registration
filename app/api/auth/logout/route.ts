import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * ออกจากระบบ — ลบ cookie "token" และ "role"
 */
export async function POST() {
  const response = NextResponse.json({ message: "ออกจากระบบสำเร็จ" });

  // ลบ JWT cookie
  response.cookies.set("token", "", {
    path: "/",
    httpOnly: true,
    maxAge: 0,
  });

  // ลบ role cookie
  response.cookies.set("role", "", {
    path: "/",
    httpOnly: false,
    maxAge: 0,
  });

  return response;
}
