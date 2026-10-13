import { applicationWhere } from "@/lib/application-query";
import { ApiError } from "@/lib/phase4-server";
import { ValidationError } from "@/lib/validation";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";
import { EVIDENCE_ITEMS, EVIDENCE_ITEM_LABELS, EVIDENCE_RESULT_LABELS, isEvidenceHistory, summarizeEvidence } from "@/lib/evidence-verification";

/**
 * GET /api/export/applications
 * ดาวน์โหลดข้อมูลใบสมัครเป็นไฟล์ CSV หรือ Excel (.xlsx)
 * Query: ?status=... &clubId=... &sport=... &competitionId=... &format=xlsx|csv
 */
export async function GET(request: Request) {
  try {
    const session = await getSession(request as NextRequest);
    if (!session) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    }
    if (!["CLUB", "STAFF", "ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const where = await applicationWhere(session, searchParams);
    const format = searchParams.get("format")?.toLowerCase();

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

    const history = applications.length
      ? await prisma.statusHistory.findMany({
          where: { applicationId: { in: applications.map((a) => a.id) }, status: { startsWith: "EVIDENCE:" } },
          orderBy: { createdAt: "asc" },
          select: { id: true, applicationId: true, status: true, label: true, by: true, createdAt: true },
        })
      : [];
    const reviewerIds = [...new Set(history.map((row) => row.by).filter((id): id is string => Boolean(id)))];
    const reviewers = reviewerIds.length
      ? await prisma.user.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, studentId: true, email: true } })
      : [];
    const evidenceColumns = (applicationId: string) => {
      const rows = history.filter((row) => row.applicationId === applicationId && isEvidenceHistory(row.status));
      const summary = summarizeEvidence(rows);
      const latest = rows[rows.length - 1];
      const reviewer = reviewers.find((user) => user.id === latest?.by);
      const passed = EVIDENCE_ITEMS.filter((item) => summary[item].result === "PASSED").length;
      return {
        "Evidence Reviewer": reviewer ? reviewer.studentId ?? reviewer.email : "",
        "Evidence Reviewed At": latest ? latest.createdAt.toISOString() : "",
        "Evidence Certification": passed === EVIDENCE_ITEMS.length ? "ผ่านครบทุกรายการ" : `ผ่าน ${passed}/${EVIDENCE_ITEMS.length} รายการ`,
        "Evidence Detail": EVIDENCE_ITEMS.map((item) => `${EVIDENCE_ITEM_LABELS[item]}: ${EVIDENCE_RESULT_LABELS[summary[item].result]}`).join(" | "),
      };
    };

    if (format === "xlsx") {
      const dataRows = applications.map((app) => {
        const profile = app.user.profile;
        return {
          "Application ID": app.id,
          "Student ID": app.user.studentId ?? "",
          "First Name": profile?.firstName || "",
          "Last Name": profile?.lastName || "",
          "Faculty": profile?.faculty || "",
          "Major": profile?.major || "",
          "Phone": profile?.phone || "",
          "Competition": app.competition.name,
          "Sport": app.sport,
          "Category": app.category,
          "Status": app.status,
          "Submitted At": app.createdAt.toISOString(),
          ...evidenceColumns(app.id),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="applications_export_${Date.now()}.xlsx"`,
        },
      });
    }

    // สร้าง Header ของ CSV (default)
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
      "Submitted At",
      "Evidence Reviewer",
      "Evidence Reviewed At",
      "Evidence Certification",
      "Evidence Detail"
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
        app.createdAt.toISOString(),
        ...Object.values(evidenceColumns(app.id))
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
