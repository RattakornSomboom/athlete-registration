import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/activities
 * ดูกิจกรรมทั้งหมด
 * Query: ?clubId=... &status=...
 */
export async function GET(request: Request) {
  try {
    const session = getSession(request as NextRequest);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    let clubId = searchParams.get("clubId");

    if (session?.role === "CLUB") {
      clubId = session.id;
    }

    const where: Record<string, unknown> = {};

    if (clubId) where.clubId = clubId;
    if (status) where.status = status;

    const activities = await prisma.activity.findMany({
      where,
      include: {
        club: {
          select: { id: true, name: true, sport: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("[GET /api/activities]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/activities
 * สร้างกิจกรรมใหม่
 *
 * Body: { clubId, title, description?, date, location?, status? }
 */
export async function POST(request: Request) {
  try {
    const session = getSession(request as NextRequest);
    if (!session || session.role !== "CLUB") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะชมรม)" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, date, location, status } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน (title, date)" },
        { status: 400 }
      );
    }

    // Find club by session id
    const club = await prisma.club.findUnique({
      where: { id: session.id },
      select: { id: true }
    });

    if (!club) {
      return NextResponse.json(
        { error: "ไม่พบชมรม" },
        { status: 404 }
      );
    }

    const clubId = club.id;

    const activity = await prisma.activity.create({
      data: {
        clubId,
        title,
        description: description || null,
        date: new Date(date),
        location: location || null,
        status: status || "planned",
      },
      include: {
        club: {
          select: { id: true, name: true, sport: true },
        },
      },
    });

    return NextResponse.json(
      { message: "สร้างกิจกรรมสำเร็จ", activity },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/activities]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
