import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/competitions
 * ดูรายการแข่งขันทั้งหมด
 * Query: ?sport=... &status=... &clubId=...
 */
export async function GET(request: Request) {
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
