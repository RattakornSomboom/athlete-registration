import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * GET /api/clubs
 * ดูรายชื่อชมรมทั้งหมด
 */
export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sport: true,
        email: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            competitions: true,
            activities: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ clubs });
  } catch (error) {
    console.error("[GET /api/clubs]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clubs
 * สร้างชมรมใหม่ (Admin)
 *
 * Body: { name: string, sport: string, email: string, password: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, sport, email, password } = body;

    if (!name || !sport || !email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const existing = await prisma.club.findFirst({
      where: {
        OR: [{ name }, { email }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "ชื่อชมรมหรืออีเมลนี้มีอยู่แล้ว" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const club = await prisma.club.create({
      data: {
        name,
        sport,
        email,
        password: hashedPassword,
      },
    });

    const { password: _, ...safeClub } = club;

    return NextResponse.json(
      { message: "สร้างชมรมสำเร็จ", club: safeClub },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/clubs]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
