import { loginInput, parseJsonObject, ValidationError } from "@/lib/validation";
import { publicUser, publicClub } from "@/lib/public-account";
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
    const { username, password } = loginInput(await parseJsonObject(request));

    // ─── ลองค้นหาใน User table ก่อน (Athlete/Staff/Admin) ───
    const isEmail = username.includes("@");
    const studentId = isEmail ? username.replace("@up.ac.th", "") : username;

    const user = await prisma.user.findFirst({
      where: { OR: [{ studentId }, ...(isEmail ? [{ email: { equals: username, mode: "insensitive" as const } }] : [])] },
      include: { profile: true },
    });

    if (user) {
      if (!user.isActive) return NextResponse.json({ error: "บัญชีถูกระงับการใช้งาน" }, { status: 403 });
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
        studentId: user.studentId ?? undefined,
      });

      const safeUser = publicUser(user);

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
      const club = await prisma.club.findFirst({
        where: { email: { equals: username, mode: "insensitive" } },
      });

      if (club) {
        if (!club.isActive) {
          return NextResponse.json(
            { error: "บัญชีชมรมของคุณถูกระงับการใช้งาน กรุณาติดต่อเจ้าหน้าที่" },
            { status: 403 }
          );
        }

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

        const safeClub = publicClub(club);

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
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message, fieldErrors: error.fieldErrors }, { status: 400 });
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
