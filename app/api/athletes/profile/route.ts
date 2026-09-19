import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/athletes/profile?studentId=...
 * ดูข้อมูลส่วนตัวนักกีฬา
 */
export async function GET(request: Request) {
  try {
    const session = await getSession(request as NextRequest);
    if (!session) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "กรุณาระบุ studentId" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { studentId },
      include: { profile: true },
    });

    if (session.role === "ATHLETE" && session.id !== user?.id) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึงข้อมูลของผู้อื่น" },
        { status: 403 }
      );
    }

    if (!user || !user.profile) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลนักกีฬา" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: user.profile });
  } catch (error) {
    console.error("[GET /api/athletes/profile]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/athletes/profile
 * อัปเดตข้อมูลส่วนตัวนักกีฬา
 *
 * Body: { studentId: string, ...profileFields }
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { studentId, ...profileData } = body;

    const session = await getSession(request as NextRequest);
    if (!session || session.studentId !== studentId) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์แก้ไขข้อมูลของผู้อื่น" },
        { status: 403 }
      );
    }

    if (!studentId) {
      return NextResponse.json(
        { error: "กรุณาระบุ studentId" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { studentId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้" },
        { status: 404 }
      );
    }

    // Convert birthDate string to Date if provided
    if (profileData.birthDate && typeof profileData.birthDate === "string") {
      profileData.birthDate = new Date(profileData.birthDate);
    }

    // Convert studentLevel to enum value
    if (profileData.studentLevel) {
      profileData.studentLevel =
        profileData.studentLevel === "graduate" ? "GRADUATE" : "BACHELOR";
    }

    const profile = await prisma.athleteProfile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: {
        userId: user.id,
        ...profileData,
      },
    });

    return NextResponse.json({ message: "อัปเดตข้อมูลสำเร็จ", profile });
  } catch (error) {
    console.error("[PUT /api/athletes/profile]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
