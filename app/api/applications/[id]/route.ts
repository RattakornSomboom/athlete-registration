import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
          const hasMatchingSport = application.competition.quotas.some(
            (q) => q.sport === club.sport
          );
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

    return NextResponse.json({ application });
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
  try {
    const session = await getSession(request as NextRequest);
    if (!session || !["CLUB", "STAFF", "ADMIN", "SUPERADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, label, by, squadType } = body;

    if (!status || !label || !by) {
      return NextResponse.json(
        { error: "กรุณาระบุ status, label, และ by" },
        { status: 400 }
      );
    }

    // For CLUB role: verify they manage this sport
    if (session.role === "CLUB") {
      if (!session.clubId) {
        return NextResponse.json({ error: "ไม่พบข้อมูลชมรม" }, { status: 403 });
      }
      const club = await prisma.club.findUnique({ where: { id: session.clubId } });
      if (!club) {
        return NextResponse.json({ error: "ไม่พบข้อมูลชมรม" }, { status: 403 });
      }
      const app = await prisma.application.findUnique({
        where: { id },
        include: { competition: { include: { quotas: true } } },
      });
      if (!app) {
        return NextResponse.json({ error: "ไม่พบใบสมัคร" }, { status: 404 });
      }
      const hasMatchingSport = app.competition.quotas.some(
        (q) => q.sport === club.sport
      );
      if (!hasMatchingSport) {
        return NextResponse.json(
          { error: "ไม่มีสิทธิ์อนุมัติใบสมัครประเภทกีฬานี้" },
          { status: 403 }
        );
      }
    }

    const application = await prisma.application.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        ...(squadType !== undefined && { squadType }),
        statusHistory: {
          create: {
            status: status.toUpperCase(),
            label,
            by,
          },
        },
      },
      include: {
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      message: "อัปเดตสถานะสำเร็จ",
      application,
    });
  } catch (error) {
    console.error("[PATCH /api/applications/[id]]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/applications/[id]
 * ยกเลิก/ลบใบสมัคร
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession(request as NextRequest);
    if (!session || !["ATHLETE", "ADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ลบใบสมัคร" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: "ไม่พบใบสมัคร" },
        { status: 404 }
      );
    }

    // Check ownership for athlete
    if (session.role === "ATHLETE" && application.userId !== session.id) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ลบใบสมัครของผู้อื่น" },
        { status: 403 }
      );
    }

    // Check status
    if (session.role === "ATHLETE" && application.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "ไม่สามารถลบใบสมัครที่ถูกพิจารณาแล้วได้" },
        { status: 400 }
      );
    }

    // Delete files from Supabase Storage
    const fileUrls = [
      application.photoFileUrl,
      application.idCardFileUrl,
      application.studentCardFileUrl,
      application.studentCertFileUrl,
      application.upAcademyFileUrl,
      application.fitnessTestFileUrl,
      application.noClubFileUrl,
    ].filter(Boolean) as string[];

    if (fileUrls.length > 0) {
      const pathsToDelete = fileUrls.map((url) => {
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split("/public/athlete-docs/");
          if (pathParts.length > 1) {
            return decodeURIComponent(pathParts[1]);
          }
        } catch {
          // ignore
        }
        return null;
      }).filter(Boolean) as string[];

      if (pathsToDelete.length > 0) {
        await supabaseAdmin.storage.from("athlete-docs").remove(pathsToDelete);
      }
    }

    // Delete application from DB
    await prisma.application.delete({
      where: { id },
    });

    return NextResponse.json({ message: "ยกเลิกใบสมัครสำเร็จ" });
  } catch (error) {
    console.error("[DELETE /api/applications/[id]]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
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

    const application = await prisma.application.findUnique({
      where: { id },
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

    if (application.status !== "SUBMITTED") {
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
    if (squadType !== undefined) updateData.squadType = squadType;
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

    const updatedApp = await prisma.application.update({
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
  } catch (error) {
    console.error("[PUT /api/applications/[id]]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขใบสมัคร" },
      { status: 500 }
    );
  }
}