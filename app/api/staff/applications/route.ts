import { protectedApplication } from "@/lib/athlete-document-policy";
import { applicationWhere } from "@/lib/application-query";
import { ApiError } from "@/lib/phase4-server";
import { ValidationError } from "@/lib/validation";
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
    const session = await getSession(request as NextRequest);
    if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (!["STAFF", "ADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะเจ้าหน้าที่)" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const where = await applicationWhere(session, searchParams);

    const applications = await prisma.application.findMany({
      where,
      include: {
        user: { select: { id: true, studentId: true, email: true, role: true, profile: true } },
        competition: {
          include: { quotas: true },
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

    return NextResponse.json({ applications: applications.map(protectedApplication), stats });
  } catch (error) {
    if (error instanceof ApiError || error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: error instanceof ApiError ? error.status : 400 });
    console.error("[GET /api/staff/applications]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
