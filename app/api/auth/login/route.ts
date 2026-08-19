import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

/**
 * POST /api/auth/login
 * เข้าสู่ระบบ — รองรับทั้ง Athlete (studentId) และ Club (email ประธานชมรม)
 *
 * Body: { username: string (studentId หรือ email), password: string }
 * Returns: { user/club, role } + set cookie "token" (httpOnly JWT)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = body.username.trim().toLowerCase();
    const { password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "กรุณากรอก username และรหัสผ่าน" },
        { status: 400 }
      );
    }

    // ─── ลองค้นหาใน User table ก่อน (Athlete/Staff/Admin) ───
    const isEmail = username.includes("@");
    const studentId = isEmail ? username.replace("@up.ac.th", "") : username;

    const user = await prisma.user.findUnique({
      where: { studentId },
      include: { profile: true },
    });

    if (user) {
      // --- Verify password ---
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
          { status: 401 }
        );
      }

      // Sign JWT
      const token = signToken({
        id: user.id,
        role: user.role,
        studentId: user.studentId,
      });

      const { password: _, ...safeUser } = user;

      const response = NextResponse.json({
        message: "เข้าสู่ระบบสำเร็จ",
        user: safeUser,
        role: user.role.toLowerCase(),
      });

      // Set httpOnly JWT cookie
      response.cookies.set("token", token, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 24h
        sameSite: "lax",
      });

      // Set role cookie (readable by JS) สำหรับ middleware
      response.cookies.set("role", user.role.toLowerCase(), {
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    // ─── ลองค้นหาใน Club table (ประธานชมรม login ด้วย email) ───
    if (isEmail || username.includes("@")) {
      const club = await prisma.club.findUnique({
        where: { email: username },
      });

      if (club) {
        const isValid = await bcrypt.compare(password, club.password);
        if (!isValid) {
          return NextResponse.json(
            { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
            { status: 401 }
          );
        }

        // Sign JWT for Club
        const token = signToken({
          id: club.id,
          role: "CLUB",
          clubId: club.id,
        });

        const { password: _, ...safeClub } = club;

        const response = NextResponse.json({
          message: "เข้าสู่ระบบสำเร็จ",
          club: safeClub,
          role: "club",
        });

        response.cookies.set("token", token, {
          path: "/",
          httpOnly: true,
          maxAge: 60 * 60 * 24,
          sameSite: "lax",
        });

        response.cookies.set("role", "club", {
          path: "/",
          httpOnly: false,
          maxAge: 60 * 60 * 24,
        });

        return response;
      }
    }

    return NextResponse.json(
      { error: "ไม่พบบัญชีผู้ใช้" },
      { status: 401 }
    );
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
