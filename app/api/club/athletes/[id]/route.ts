import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/club/athletes/[id]
 * ดูรายละเอียดนักกีฬาของชมรม (ข้อมูลเต็มรูปแบบเหมือนกองกิจ)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request, "CLUB");
    if ("error" in auth) return auth.error;
    const { session } = auth;

    if (!session.clubId) {
      return NextResponse.json({ error: "ไม่พบข้อมูลชมรม" }, { status: 403 });
    }

    const club = await prisma.club.findUnique({
      where: { id: session.clubId },
    });
    if (!club) {
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
    }

    const { id: applicationId } = await params;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            studentId: true,
            email: true,
            role: true,
            profile: true,
          },
        },
        competition: {
          include: { quotas: true },
        },
        competitionResults: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        sportEntries: true,
        rosterItem: {
          select: {
            squadType: true,
            roster: {
              select: {
                club: {
                  select: { id: true, name: true, sport: true },
                },
              },
            },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "ไม่พบใบสมัคร" }, { status: 404 });
    }

    if (application.clubId !== club.id) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงใบสมัครของชมรมอื่น" }, { status: 403 });
    }

    const { rosterItem, ...safeApplication } = application;

    return NextResponse.json({
      application: {
        ...safeApplication,
        rosterClub: rosterItem?.roster.club ?? null,
        squadType: rosterItem?.squadType ?? application.squadType ?? null,
      },
    });
  } catch (error) {
    console.error("[GET /api/club/athletes/[id]]", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
