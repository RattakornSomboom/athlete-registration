import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/staff/applications
 * เจ้าหน้าที่ดูใบสมัครทั้งหมด (รวมทุกชมรม)
 * Query: ?status=... &clubId=... &sport=...
 */
export async function GET(request: Request) {
  try {
    const session = getSession(request as NextRequest);
    if (!session || !["STAFF", "ADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะเจ้าหน้าที่)" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clubId = searchParams.get("clubId");
    const sport = searchParams.get("sport");
    const competitionId = searchParams.get("competitionId");

    const where: Record<string, unknown> = {};

    if (status) where.status = status.toUpperCase();
    if (sport) where.sport = sport;
    if (competitionId) {
      where.competitionId = competitionId;
    } else if (clubId) {
      where.competition = { clubId };
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        user: {
          include: { profile: true },
        },
        competition: {
          include: {
            club: {
              select: { id: true, name: true, sport: true },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        sportEntries: true,
        competitionResults: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // สรุปสถิติ
    const stats = {
      total: applications.length,
      submitted: applications.filter((a) => a.status === "SUBMITTED").length,
      clubApproved: applications.filter((a) => a.status === "CLUB_APPROVED").length,
      clubRejected: applications.filter((a) => a.status === "CLUB_REJECTED").length,
      staffApproved: applications.filter((a) => a.status === "STAFF_APPROVED").length,
      staffRejected: applications.filter((a) => a.status === "STAFF_REJECTED").length,
      finalSelected: applications.filter((a) => a.status === "FINAL_SELECTED").length,
    };

    return NextResponse.json({ applications, stats });
  } catch (error) {
    console.error("[GET /api/staff/applications]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
