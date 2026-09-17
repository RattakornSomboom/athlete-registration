import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/applications?userId=...&status=...
 * ดูรายการใบสมัคร (filter ด้วย userId หรือ status ได้)
 */
export async function GET(request: Request) {
  try {
    const session = getSession(request as NextRequest);
    if (!session) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");
    const competitionId = searchParams.get("competitionId");

    const where: Record<string, unknown> = {};

    if (competitionId) {
      where.competitionId = competitionId;
    }

    if (session.role === "ATHLETE") {
      where.userId = session.id;
    } else {
      if (userId) {
        where.userId = userId;
      } else if (studentId) {
        const user = await prisma.user.findUnique({
          where: { studentId },
        });
        if (user) {
          where.userId = user.id;
        } else {
          return NextResponse.json({ applications: [] });
        }
      }
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        user: {
          include: { profile: true },
        },
        competition: {
          include: { club: true },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        sportEntries: true,
        competitionResults: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("[GET /api/applications]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/applications
 * ส่งใบสมัครลงแข่ง
 *
 * Body: {
 *   studentId: string,
 *   competitionId: string,
 *   sport: string,
 *   category: string,
 *   division?: string,
 *   note?: string,
 *   sportEntries?: Array<{ sport, category, division? }>,
 *   competitionResults?: Array<{ competitionName, year, result }>
 * }
 */
export async function POST(request: Request) {
  try {
    const session = getSession(request as NextRequest);
    if (!session || session.role !== "ATHLETE") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะนักกีฬา)" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      studentId,
      competitionId,
      sport,
      category,
      division,
      note,
      sportEntries,
      competitionResults,
      photoFileUrl,
      idCardFileUrl,
      studentCardFileUrl,
      studentCertFileUrl,
      upAcademyFileUrl,
      fitnessTestFileUrl,
      noClubFileUrl,
      supervisorName,
      supervisorPosition,
      round,
      previousBachelorCount,
      previousGraduateCount,
      previousLastYear,
    } = body;

    if (!studentId || !competitionId || !sport || !category) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { studentId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้ หรือยังไม่ได้ลงทะเบียนประวัตินักกีฬา" },
        { status: 404 }
      );
    }

    // ─── การตรวจสอบสิทธิ์ (Validation) ───
    const CURRENT_YEAR_CE = 2026;
    const birthYearCE = user.profile.birthDate.getFullYear();
    const athleteAge = CURRENT_YEAR_CE - birthYearCE;
    if (athleteAge > 28) {
      return NextResponse.json(
        { error: `ไม่อนุญาตให้สมัคร เนื่องจากอายุเกิน 28 ปี (อายุ ${athleteAge} ปี)` },
        { status: 400 }
      );
    }

    const prevB = parseInt(previousBachelorCount || "0", 10);
    const prevG = parseInt(previousGraduateCount || "0", 10);
    const totalPreviousEntries = prevB + prevG;
    const maxEntries = user.profile.studentLevel === "GRADUATE" ? 3 : 5;
    
    if (totalPreviousEntries >= maxEntries) {
      return NextResponse.json(
        { error: `ไม่อนุญาตให้สมัคร เนื่องจากเข้าร่วมการแข่งขันครบ ${maxEntries} ครั้งแล้ว` },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        competitionId,
        sport,
        category,
        division: division || null,
        note: note || null,
        status: "SUBMITTED",
        photoFileUrl: photoFileUrl || "",
        idCardFileUrl: idCardFileUrl || "",
        studentCardFileUrl: studentCardFileUrl || "",
        studentCertFileUrl: studentCertFileUrl || "",
        upAcademyFileUrl: upAcademyFileUrl || "",
        fitnessTestFileUrl: fitnessTestFileUrl || "",
        noClubFileUrl: noClubFileUrl || null,
        supervisorName: supervisorName || null,
        supervisorPosition: supervisorPosition || null,
        statusHistory: {
          create: {
            status: "SUBMITTED",
            label: "ส่งใบสมัคร",
            by: `${studentId}@up.ac.th`,
          },
        },
        ...(sportEntries?.length
          ? {
              sportEntries: {
                create: sportEntries.map(
                  (entry: { sport: string; category: string; division?: string }) => ({
                    sport: entry.sport,
                    category: entry.category,
                    division: entry.division || null,
                  })
                ),
              },
            }
          : {}),
        ...(competitionResults?.length
          ? {
              competitionResults: {
                create: competitionResults.map(
                  (result: { competitionName: string; year: string; result: string }) => ({
                    competitionName: result.competitionName,
                    year: result.year,
                    result: result.result,
                  })
                ),
              },
            }
          : {}),
      },
      include: {
        statusHistory: true,
        sportEntries: true,
        competitionResults: true,
      },
    });

    return NextResponse.json(
      { message: "ส่งใบสมัครสำเร็จ", application },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/applications]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
