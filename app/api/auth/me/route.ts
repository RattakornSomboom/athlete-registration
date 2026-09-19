import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/auth/me
 * ดูข้อมูล user ที่ login อยู่ปัจจุบัน
 * อ่าน JWT จาก httpOnly cookie "token"
 *
 * Returns: { id, role, user/club, profile? }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "ไม่ได้เข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    // ─── Club ───
    if (session.role === "CLUB" && session.clubId) {
      const club = await prisma.club.findUnique({
        where: { id: session.clubId },
        select: {
          id: true,
          name: true,
          sport: true,
          email: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!club) {
        return NextResponse.json({ error: "ไม่พบข้อมูลชมรม" }, { status: 404 });
      }

      return NextResponse.json({
        id: session.id,
        role: "club",
        club,
      });
    }

    // ─── User (Athlete / Staff / Admin) ───
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
    }

    const { password: _, ...safeUser } = user;

    return NextResponse.json({
      id: session.id,
      role: user.role.toLowerCase(),
      user: safeUser,
    });
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
