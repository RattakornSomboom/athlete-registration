import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/clubs/[id]/athletes
 * ดูนักกีฬาที่สมัครเข้าชมรม
 * Query: ?status=... (optional filter)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const club = await prisma.club.findUnique({
      where: { id },
    });

    if (!club) {
      return NextResponse.json(
        { error: "ไม่พบชมรม" },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = {
      competition: { clubId: id },
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        user: {
          include: { profile: true },
        },
        competition: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        sportEntries: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ athletes: applications, club: { id: club.id, name: club.name, sport: club.sport } });
  } catch (error) {
    console.error("[GET /api/clubs/[id]/athletes]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
