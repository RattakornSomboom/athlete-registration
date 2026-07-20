import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/clubs/[id]/competitions
 * ดูรายการแข่งขันของชมรม
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const club = await prisma.club.findUnique({
      where: { id },
    });

    if (!club) {
      return NextResponse.json(
        { error: "ไม่พบชมรม" },
        { status: 404 }
      );
    }

    const competitions = await prisma.competition.findMany({
      where: { clubId: id },
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ competitions, club: { id: club.id, name: club.name, sport: club.sport } });
  } catch (error) {
    console.error("[GET /api/clubs/[id]/competitions]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
