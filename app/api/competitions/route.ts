import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/competitions
 * ดูรายการแข่งขันทั้งหมด
 * Query: ?sport=... &status=... &clubId=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport");
    const status = searchParams.get("status");
    const clubId = searchParams.get("clubId");

    const where: Record<string, unknown> = {};

    if (sport) where.sport = sport;
    if (status) where.status = status.toUpperCase();
    if (clubId) where.clubId = clubId;

    const competitions = await prisma.competition.findMany({
      where,
      include: {
        club: {
          select: { id: true, name: true, sport: true },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error("[GET /api/competitions]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/competitions
 * เจ้าหน้าที่/Admin สร้างรายการแข่งขัน และมอบหมายให้ชมรม
 *
 * Body: { name, sport, round, year, clubId }
 * Returns: competition object
 */
export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);

    if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "เฉพาะเจ้าหน้าที่หรือผู้ดูแลระบบเท่านั้นที่สามารถสร้างรายการแข่งขันได้" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, sport, round, year, clubId } = body;

    if (!name || !sport || !round || !year || !clubId) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน (name, sport, round, year, clubId)" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าชมรมนั้นมีอยู่จริง
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      return NextResponse.json({ error: "ไม่พบชมรมที่ระบุ" }, { status: 404 });
    }

    const competition = await prisma.competition.create({
      data: {
        clubId,
        name,
        sport,
        round,
        year: parseInt(year),
        status: "OPEN",
      },
      include: {
        club: {
          select: { id: true, name: true, sport: true },
        },
      },
    });

    return NextResponse.json(
      { message: "สร้างรายการแข่งขันสำเร็จ", competition },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/competitions]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
