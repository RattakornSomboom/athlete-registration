import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/export/applications
 * ดาวน์โหลดข้อมูลใบสมัครเป็นไฟล์ CSV
 * Query: ?status=... &clubId=... &sport=... &competitionId=...
 */
export async function GET(request: Request) {
  try {
    const session = getSession(request as NextRequest);
    if (!session || !["CLUB", "STAFF", "ADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clubIdParam = searchParams.get("clubId");
    const sport = searchParams.get("sport");
    const competitionId = searchParams.get("competitionId");

    const where: Record<string, unknown> = {};

    if (status) where.status = status.toUpperCase();
    if (sport) where.sport = sport;
    if (competitionId) {
      where.competitionId = competitionId;
    } else {
        // ถ้าเป็น Club ต้องเห็นเฉพาะของตัวเองเสมอ
        const clubId = session.role === "CLUB" ? session.clubId : clubIdParam;
        if (clubId) {
            where.competition = { clubId };
        }
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
              select: { name: true, sport: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // สร้าง Header ของ CSV
    const csvHeader = [
      "Application ID",
      "Student ID",
      "First Name",
      "Last Name",
      "Faculty",
      "Major",
      "Phone",
      "Competition",
      "Club",
      "Sport",
      "Category",
      "Status",
      "Submitted At"
    ].join(",");

    // สร้าง Data rows ของ CSV
    const csvRows = applications.map((app) => {
      const profile = app.user.profile;
      const row = [
        app.id,
        app.user.studentId,
        profile?.firstName || "",
        profile?.lastName || "",
        profile?.faculty || "",
        profile?.major || "",
        profile?.phone || "",
        app.competition.name,
        app.competition.club.name,
        app.sport,
        app.category,
        app.status,
        app.createdAt.toISOString()
      ];
      // ป้องกันเครื่องหมายจุลภาคในข้อมูล ทำให้ CSV เพี้ยน
      return row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [csvHeader, ...csvRows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="applications_export_${new Date().getTime()}.csv"`,
      },
    });

  } catch (error) {
    console.error("[GET /api/export/applications]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลสำหรับส่งออก" },
      { status: 500 }
    );
  }
}
