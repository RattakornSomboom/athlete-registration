import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { api, atomic, body, ensure, string, STAFF } from "@/lib/phase4-server";

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
    if (session.role === "STAFF" || session.role === "ADMIN" || session.role === "SUPERADMIN") {
      isAuthorized = true;
    } else if (session.role === "CLUB") {
      // Club can access if the competition has a sport quota matching their sport
      if (session.clubId) {
        const club = await prisma.club.findUnique({ where: { id: session.clubId } });
        if (club) {
          const hasMatchingSport = application.sport === club.sport;
          isAuthorized = hasMatchingSport;
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
    return NextResponse.json({ application: { ...safeApplication, rosterClub: rosterItem?.roster.club ?? null } });
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
        ensure(["STAFF_APPROVED", "STAFF_REJECTED"].includes(status) && app.status === "CLUB_APPROVED", "ต้องผ่านชมรมก่อนกองกิจฯ", 409);
        ensure(!app.rosterItem || app.rosterItem.roster.status === "SUBMITTED", "บัญชีชมรมยังไม่ถูกส่ง", 409);
        ensure(data.squadType === undefined || data.squadType === app.squadType, "เปลี่ยนบัญชีที่ชมรมรับรองไม่ได้", 409);
      }
      return { application: await tx.application.update({ where: { id }, data: {
        status: status as "CLUB_APPROVED" | "CLUB_REJECTED" | "STAFF_APPROVED" | "STAFF_REJECTED",
        statusHistory: { create: { status: status as "CLUB_APPROVED" | "CLUB_REJECTED" | "STAFF_APPROVED" | "STAFF_REJECTED", label, by: session.id } },
      }, include: { statusHistory: { orderBy: { createdAt: "asc" } } } }), message: "อัปเดตสถานะสำเร็จ" };
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
  try {
    const session = await getSession(request as NextRequest);
    if (!session || !session.id || session.role !== "ATHLETE") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง (สำหรับนักกีฬาเท่านั้น)" },
        { status: 403 }
      );
    }

    const { id } = await params;

    return await atomic(async tx => {
    const application = await tx.application.findUnique({
      where: { id },
      include: { rosterItem: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลใบสมัคร" },
        { status: 404 }
      );
    }

    if (application.userId !== session.id) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์แก้ไขใบสมัครของผู้อื่น" },
        { status: 403 }
      );
    }

    if (application.rosterItem || application.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "ไม่สามารถแก้ไขใบสมัครได้ เนื่องจากใบสมัครถูกประมวลผลไปแล้ว" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // ดึงเฉพาะฟิลด์ที่สามารถแก้ไขได้ (ยกเว้นสถานะและข้อมูลสำคัญที่เกี่ยวกับชมรม)
    const {
      sport, category, division, squadType, note,
      photoFileUrl, idCardFileUrl, studentCardFileUrl, studentCertFileUrl,
      upAcademyFileUrl, fitnessTestFileUrl, noClubFileUrl, supervisorName, supervisorPosition,
      sportEntries, competitionResults,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (sport !== undefined) updateData.sport = sport;
    if (category !== undefined) updateData.category = category;
    if (division !== undefined) updateData.division = division;
    if (squadType !== undefined && squadType !== application.squadType) {
      return NextResponse.json({ error: "จัดตัวจริง/สำรองผ่านบัญชีชมรมเท่านั้น" }, { status: 403 });
    }
    if (note !== undefined) updateData.note = note;
    if (photoFileUrl !== undefined) updateData.photoFileUrl = photoFileUrl;
    if (idCardFileUrl !== undefined) updateData.idCardFileUrl = idCardFileUrl;
    if (studentCardFileUrl !== undefined) updateData.studentCardFileUrl = studentCardFileUrl;
    if (studentCertFileUrl !== undefined) updateData.studentCertFileUrl = studentCertFileUrl;
    if (upAcademyFileUrl !== undefined) updateData.upAcademyFileUrl = upAcademyFileUrl;
    if (fitnessTestFileUrl !== undefined) updateData.fitnessTestFileUrl = fitnessTestFileUrl;
    if (noClubFileUrl !== undefined) updateData.noClubFileUrl = noClubFileUrl;
    if (supervisorName !== undefined) updateData.supervisorName = supervisorName;
    if (supervisorPosition !== undefined) updateData.supervisorPosition = supervisorPosition;

    // ถ้ามีการส่ง sportEntries หรือ competitionResults ใหม่มา จะลบของเก่าแล้วสร้างใหม่ทั้งหมด
    if (sportEntries !== undefined) {
      updateData.sportEntries = {
        deleteMany: {},
        create: sportEntries.map((entry: { sport: string; category: string; division?: string }) => ({
          sport: entry.sport,
          category: entry.category,
          division: entry.division || null,
        })),
      };
    }

    if (competitionResults !== undefined) {
      updateData.competitionResults = {
        deleteMany: {},
        create: competitionResults.map((result: { competitionName: string; year: string; result: string }) => ({
          competitionName: result.competitionName,
          year: result.year,
          result: result.result,
        })),
      };
    }

    const updatedApp = await tx.application.update({
      where: { id },
      data: updateData,
      include: {
        sportEntries: true,
        competitionResults: true,
      },
    });

    return NextResponse.json({
      message: "อัปเดตใบสมัครสำเร็จ",
      application: updatedApp,
    });
    });
  } catch (error) {
    console.error("[PUT /api/applications/[id]]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขใบสมัคร" },
      { status: 500 }
    );
  }
}
