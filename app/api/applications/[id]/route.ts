import { athleteApplicationInput } from "@/lib/validation";
import { retainAthleteDocuments, assertPrivateBucket } from "@/lib/document-service";
import { ATHLETE_DOCUMENT_FIELDS, documentId, protectedApplication } from "@/lib/athlete-document-policy";
﻿import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { api, atomic, body, ensure, string, STAFF, openCompetition } from "@/lib/phase4-server";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/applications/[id]
 * ดูรายละเอียดใบสมัคร
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await getSession(_request as NextRequest);
    if (!session) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        rosterItem: { select: { roster: { select: { club: { select: { id: true, name: true, sport: true } } } } } },
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
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        sportEntries: true,
        competitionResults: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "ไม่พบใบสมัคร" },
        { status: 404 }
      );
    }

    // Check authorization
    let isAuthorized = false;
    if (session.role === "STAFF" || session.role === "ADMIN") {
      isAuthorized = true;
    } else if (session.role === "CLUB") {
      // Club can only access applications rostered by their club
      if (session.clubId) {
        const club = await prisma.club.findUnique({ where: { id: session.clubId } });
        if (club) {
          const hasMatchingSport = application.sport === club.sport;
          isAuthorized = hasMatchingSport && !!application.rosterItem && application.rosterItem.roster.club.id === club.id;
        }
      }
    } else if (session.role === "ATHLETE" && application.userId === session.id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึงข้อมูลใบสมัครนี้" },
        { status: 403 }
      );
    }

    const { rosterItem, ...safeApplication } = application;
    return NextResponse.json({ application: { ...protectedApplication(safeApplication), rosterClub: rosterItem?.roster.club ?? null } });
  } catch (error) {
    console.error("[GET /api/applications/[id]]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/applications/[id]
 * อัปเดตสถานะใบสมัคร (ชมรมอนุมัติ/ปฏิเสธ, เจ้าหน้าที่อนุมัติ/ปฏิเสธ)
 *
 * Body: { status: string, label: string, by: string, squadType?: string }
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  return api(request, ["CLUB", ...STAFF], async session => {
    const { id } = await params; const data = await body(request);
    const status = string(data.status, "status").toUpperCase();
    const label = string(data.label, "เหตุผล/ผลพิจารณา", 2000);
    return atomic(async tx => {
      const app = await tx.application.findUnique({ where: { id }, include: { rosterItem: { include: { roster: true } } } });
      ensure(app, "ไม่พบใบสมัคร", 404);
      if (session.role === "CLUB") {
        ensure(session.clubId, "ไม่พบชมรม", 403);
        const club = await tx.club.findUnique({ where: { id: session.clubId } });
        ensure(club?.isActive && club.sport === app.sport, "ไม่มีสิทธิ์พิจารณากีฬานี้", 403);
        const roster = await tx.clubRoster.findUnique({ where: { clubId_competitionId: { clubId: club.id, competitionId: app.competitionId } } });
        ensure(roster?.status !== "SUBMITTED" && !app.rosterItem, "บัญชีถูกล็อก หรือรายการต้องแก้ผ่านหน้าบัญชีชมรม", 409);
        ensure(status === "CLUB_REJECTED" && ["SUBMITTED", "CLUB_APPROVED", "CLUB_REJECTED"].includes(app.status), "การอนุมัติต้องส่งบัญชีพร้อมเอกสารลงนามผ่านหน้าบัญชีชมรม", 409);
        ensure(data.squadType === undefined, "จัดตัวจริง/สำรองผ่านบัญชีชมรมเท่านั้น", 400);
      } else {
        ensure(["STAFF_APPROVED", "STAFF_REJECTED"].includes(status) && ["SUBMITTED", "CLUB_APPROVED"].includes(app.status), "สถานะนี้ไม่สามารถพิจารณาได้", 409);
        ensure(!app.rosterItem || app.rosterItem.roster.status === "SUBMITTED", "บัญชีชมรมยังไม่ถูกส่ง", 409);
        ensure(data.squadType === undefined || data.squadType === app.squadType, "เปลี่ยนบัญชีที่ชมรมรับรองไม่ได้", 409);
      }
      return { application: protectedApplication(await tx.application.update({ where: { id }, data: {
        status: status as "CLUB_APPROVED" | "CLUB_REJECTED" | "STAFF_APPROVED" | "STAFF_REJECTED",
        statusHistory: { create: { status: status as "CLUB_APPROVED" | "CLUB_REJECTED" | "STAFF_APPROVED" | "STAFF_REJECTED", label, by: session.id } },
      }, include: { statusHistory: { orderBy: { createdAt: "asc" } } } })), message: "อัปเดตสถานะสำเร็จ" };
    });
  });
}

/**
 * DELETE /api/applications/[id]
 * ยกเลิก/ลบใบสมัคร
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  return api(request, ["ATHLETE", "ADMIN"], async session => {
    const { id } = await params;
    return atomic(async tx => {
      const app = await tx.application.findUnique({ where: { id }, include: { rosterItem: true } });
      ensure(app, "ไม่พบใบสมัคร", 404);
      ensure(session.role === "ADMIN" || app.userId === session.id, "ไม่มีสิทธิ์", 403);
      ensure(!app.rosterItem && app.status === "SUBMITTED", "ลบรายการที่อยู่ในบัญชีหรือพิจารณาแล้วไม่ได้", 409);
      // Legacy uploads may be shared between applications; do not destroy shared files here.
      await tx.application.delete({ where: { id } });
      return { message: "ยกเลิกใบสมัครสำเร็จ" };
    });
  });
}

/**
 * PUT /api/applications/[id]
 * อัปเดตข้อมูลใบสมัคร (เฉพาะนักกีฬาเจ้าของใบสมัคร และสถานะต้องเป็น SUBMITTED)
 */
export async function PUT(request: Request, { params }: RouteParams) {
  return api(request, ["ATHLETE"], async session => {
    const { id } = await params;
    const input = await body(request);
    return atomic(async tx => {
      const application = await tx.application.findUnique({ where: { id }, include: { rosterItem: true } });
      ensure(application, "ไม่พบใบสมัคร", 404);
      ensure(application.userId === session.id, "ไม่มีสิทธิ์", 403);
      ensure(!application.rosterItem && application.status === "SUBMITTED", "ใบสมัครถูกพิจารณาหรืออยู่ในบัญชีแล้ว", 409);
      ensure(input.competitionId === undefined || input.competitionId === application.competitionId, "เปลี่ยนการแข่งขันไม่ได้");
      ensure(input.squadType === undefined || input.squadType === application.squadType, "ไม่อนุญาตให้จัดบัญชีเอง", 403);
      const parsed = athleteApplicationInput({ ...application, status: undefined, userId: undefined, ...input });
      const c = await openCompetition(tx, application.competitionId);
      ensure(c.quotas.some(q => q.sport === parsed.sport) && parsed.sportEntries.every(e => c.quotas.some(q => q.sport === e.sport)), "กีฬาไม่อยู่ในการแข่งขัน");
      const documents: Record<string, string | null> = {};
      for (const field of ATHLETE_DOCUMENT_FIELDS) {
        if (input[field] === undefined || input[field] === application[field]
          || input[field] === "/api/applications/" + id + "/documents/" + field) continue;
        if (field === "noClubFileUrl" && (input[field] === null || input[field] === "")) { documents[field] = null; continue; }
        ensure(documentId(input[field]), "เอกสารไม่ถูกต้อง");
        documents[field] = input[field] as string;
      }
      if (Object.keys(documents).length) {
        await assertPrivateBucket();
        await retainAthleteDocuments(tx, documents, session.id, true);
      }
      const updated = await tx.application.update({ where: { id }, data: {
        sport: parsed.sport, category: parsed.category, division: parsed.division, note: parsed.note,
        supervisorName: parsed.supervisorName, supervisorPosition: parsed.supervisorPosition, ...documents,
        ...(input.sportEntries !== undefined ? { sportEntries: { deleteMany: {}, create: parsed.sportEntries } } : {}),
        ...(input.competitionResults !== undefined ? { competitionResults: { deleteMany: {}, create: parsed.competitionResults } } : {}),
      }, include: { sportEntries: true, competitionResults: true } });
      return { application: protectedApplication(updated), message: "บันทึกแล้ว" };
    });
  });
}
