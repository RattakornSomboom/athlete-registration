import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/applications
 * ดูรายการใบสมัครของตัวเอง (เฉพาะนักกีฬา)
 */
export async function GET(request: Request) {
  try {
    const session = await getSession(request as NextRequest);
    if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (session.role !== "ATHLETE") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะนักกีฬา)" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      userId: session.id,
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        rosterItem: { select: { roster: { select: { club: { select: { id: true, name: true, sport: true } } } } } },
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

    return NextResponse.json({ applications: applications.map(({ rosterItem, ...application }) => ({ ...application, rosterClub: rosterItem?.roster.club ?? null })) });
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
 * ส่งใบสมัครเข้าร่วมการแข่งขัน (เฉพาะนักกีฬา)
 */
export async function POST(request: Request) {
  try {
    const session = await getSession(request as NextRequest);
    if (!session || (session.role !== "ATHLETE" && session.role !== "SUPERADMIN")) {
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
      previousBachelorCount,
      previousGraduateCount,
    } = body;

    if (!studentId || !competitionId || !sport || !category) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }
    
    // Mandatory document check (not empty strings)
    if (!photoFileUrl?.trim() || !idCardFileUrl?.trim() || !studentCardFileUrl?.trim() || !studentCertFileUrl?.trim() || !upAcademyFileUrl?.trim() || !fitnessTestFileUrl?.trim()) {
      return NextResponse.json(
        { error: "กรุณาแนบเอกสารบังคับให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // Prevent spoofing: ATHLETE can only submit for themselves
    if (session.role === "ATHLETE" && session.studentId && studentId !== session.studentId) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ส่งใบสมัครแทนผู้อื่น" },
        { status: 403 }
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

    // Validate Competition Status & Deadline
    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) {
      return NextResponse.json({ error: "ไม่พบการแข่งขัน" }, { status: 404 });
    }
    if (competition.status === "CLOSED") {
      return NextResponse.json({ error: "รายการแข่งขันนี้ปิดรับสมัครแล้ว" }, { status: 400 });
    }
    if (competition.deadline && new Date(competition.deadline) < new Date()) {
      return NextResponse.json({ error: "หมดเขตรับสมัครแล้ว" }, { status: 400 });
    }

    // Duplicate Check
    const existingApp = await prisma.application.findUnique({
      where: {
        userId_competitionId_sport: {
          userId: user.id,
          competitionId,
          sport
        }
      }
    });
    
    if (existingApp) {
      return NextResponse.json({ error: "ท่านได้ส่งใบสมัครสำหรับชนิดกีฬานี้ในรายการแข่งขันนี้ไปแล้ว" }, { status: 409 });
    }

    // ─── การตรวจสอบสิทธิ์ (Validation) ───
    const CURRENT_YEAR_CE = 2026;
    const birthYearCE = user.profile.birthDate.getFullYear();
    const athleteAge = CURRENT_YEAR_CE - birthYearCE;
    
    // Check if Staff set a custom age limit for this sport
    const quota = await prisma.sportQuota.findFirst({
      where: { competitionId, sport }
    });
    const maxAge = quota?.ageLimit || 28;

    if (athleteAge > maxAge) {
      return NextResponse.json(
        { error: `ไม่อนุญาตให้สมัคร เนื่องจากอายุเกิน ${maxAge} ปี (อายุ ${athleteAge} ปี)` },
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
        photoFileUrl: photoFileUrl,
        idCardFileUrl: idCardFileUrl,
        studentCardFileUrl: studentCardFileUrl,
        studentCertFileUrl: studentCertFileUrl,
        upAcademyFileUrl: upAcademyFileUrl,
        fitnessTestFileUrl: fitnessTestFileUrl,
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