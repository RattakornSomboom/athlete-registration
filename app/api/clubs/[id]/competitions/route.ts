import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/clubs/[id]/competitions
 * ดูรายการแข่งขันที่เกี่ยวข้องกับชมรม (match by sport quota)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request as NextRequest, "CLUB", "STAFF", "ADMIN", "SUPERADMIN");
    if ("error" in auth) return auth.error;
    const { session } = auth;

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

    // CLUB can only view their own club competitions
    if (session.role === "CLUB" && session.clubId !== id) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึงข้อมูลชมรมอื่น" },
        { status: 403 }
      );
    }

    // Find competitions that have a sport quota matching this club's sport
    const competitions = await prisma.competition.findMany({
      where: {
        quotas: { some: { sport: club.sport } },
      },
      include: {
        quotas: true,
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