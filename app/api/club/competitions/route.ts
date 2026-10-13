import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/club/competitions
 * รายการแข่งขันที่เกี่ยวข้องกับชมรมของผู้ใช้ที่ล็อกอิน
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, "CLUB");
    if ("error" in auth) return auth.error;
    const { session } = auth;

    if (!session.clubId) {
      return NextResponse.json({ error: "ไม่พบบัญชีชมรม" }, { status: 403 });
    }

    const club = await prisma.club.findUnique({
      where: { id: session.clubId },
    });

    if (!club) {
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
    }

    const competitions = await prisma.competition.findMany({
      where: {
        quotas: { some: { sport: club.sport } },
      },
      include: {
        quotas: { where: { sport: club.sport } },
        _count: {
          select: {
            applications: {
              where: {
                clubId: club.id,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const competitionsWithCounts = await Promise.all(
      competitions.map(async (c) => {
        const pendingCount = await prisma.application.count({
          where: {
            competitionId: c.id,
            clubId: club.id,
            status: "SUBMITTED",
          },
        });
        return {
          id: c.id,
          name: c.name,
          sport: club.sport,
          eventName: c.name,
          category: "กีฬาบังคับ",
          round: c.round,
          year: c.year,
          deadline: c.deadline,
          status: c.status,
          isOpen: c.status === "OPEN",
          totalApplicants: c._count.applications,
          pendingCount,
          quotas: c.quotas,
        };
      })
    );

    return NextResponse.json({
      competitions: competitionsWithCounts,
      club: {
        id: club.id,
        name: club.name,
        sport: club.sport,
        email: club.email,
        presidentName: club.presidentName,
      },
    });
  } catch (error) {
    console.error("[GET /api/club/competitions]", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
