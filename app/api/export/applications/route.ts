import { applicationWhere } from "@/lib/application-query";
import { ApiError } from "@/lib/phase4-server";
import { ValidationError } from "@/lib/validation";
﻿import { NextResponse } from "next/server";
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
    const session = await getSession(request as NextRequest);
    if (!session || !["CLUB", "STAFF", "ADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const where = await applicationWhere(session, searchParams);

    const applications = await prisma.application.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            studentId: true,
            email: true,
            profile: true,
          },
        },
        competition: {
          select: {
            id: true,
            name: true,
            round: true,
            year: true,
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
        app.sport,
        app.category,
        app.status,
        app.createdAt.toISOString()
      ];
      // ป้องกัน CSV formula injection และ double-quote escaping
      return row.map(v => {
        let cell = String(v ?? "").replace(/"/g, '""');
        if (/^\s*[=+@-]/.test(cell)) cell = "'" + cell;
        return `"${cell}"`;
      }).join(",");
    });

    const bom = "\uFEFF";
    const csvContent = bom + [csvHeader, ...csvRows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="applications_export_${new Date().getTime()}.csv"`,
      },
    });

  } catch (error) {
    if (error instanceof ApiError || error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: error instanceof ApiError ? error.status : 400 });
    console.error("[GET /api/export/applications]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลสำหรับส่งออก" },
      { status: 500 }
    );
  }
}