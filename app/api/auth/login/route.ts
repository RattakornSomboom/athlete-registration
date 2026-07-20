import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/login
 * เข้าสู่ระบบ
 *
 * Body: { username: string (email or studentId), password: string }
 * Returns: { user, role }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "กรุณากรอก username และรหัสผ่าน" },
        { status: 400 }
      );
    }

    // --- Find user by email or studentId ---
    const studentId = username.replace("@up.ac.th", "");

    const user = await prisma.user.findUnique({
      where: { studentId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้" },
        { status: 401 }
      );
    }

    // --- Verify password ---
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Remove password from response
    const { password: _, ...safeUser } = user;

    const response = NextResponse.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: safeUser,
      role: user.role.toLowerCase(),
    });

    // Set role cookie for middleware
    response.cookies.set("role", user.role.toLowerCase(), {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
