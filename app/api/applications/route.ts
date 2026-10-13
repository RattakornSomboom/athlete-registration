import { api, atomic, body, ensure } from "@/lib/phase4-server";
import { athleteApplicationInput } from "@/lib/validation";
import { retainAthleteDocuments, retainCompetitionResultDocuments, assertPrivateBucket } from "@/lib/document-service";
import { protectedApplication, checkAthleteRequiredDocuments } from "@/lib/athlete-document-policy";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { assertAthleteEligibility } from "@/lib/athlete-eligibility";
import { encodeClubNote } from "@/lib/university-clubs";
import { validateApplicationClub } from "@/lib/application-club-service";
import { getSportEntryLimit, getSportType } from "@/lib/sport-type";

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
      const upper = status.toUpperCase();
      const validStatuses = ["SUBMITTED", "CLUB_APPROVED", "CLUB_REJECTED", "STAFF_APPROVED", "STAFF_REJECTED", "FINAL_SELECTED"];
      if (!validStatuses.includes(upper)) {
        return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
      }
      where.status = upper;
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        club: { select: { id: true, name: true, sport: true } },
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

    return NextResponse.json({ applications: applications.map(({ rosterItem, ...application }) => ({ ...protectedApplication(application), rosterClub: rosterItem?.roster.club ?? application.club ?? null })) });
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
  const response = await api(request, ["ATHLETE"], async session => {
    const input = await body(request);
    const parsed = athleteApplicationInput(input);
    await assertPrivateBucket();
    return atomic(async tx => {
      const user = await tx.user.findUnique({ where: { id: session.id }, include: { profile: true } });
      ensure(user?.isActive && user.profile && user.studentId, "กรุณากรอกประวัตินักกีฬาให้ครบ", 409);
      ensure(input.studentId === undefined || input.studentId === user.studentId, "ส่งใบสมัครได้เฉพาะตนเอง", 403);
      const competition = await tx.competition.findUnique({ where: { id: parsed.competitionId }, include: { quotas: true } });
      ensure(competition, "ไม่พบการแข่งขัน", 404);
      ensure(competition.status === "OPEN", "รายการแข่งขันนี้ไม่เปิดรับสมัคร");
      ensure(!competition.deadline || competition.deadline >= new Date(), "หมดเขตรับสมัครแล้ว");
      const quota = competition.quotas.find(q => q.sport === parsed.sport);
      ensure(quota, "กีฬาไม่อยู่ในการแข่งขันนี้");
      const sportType = getSportType(parsed.sport);
      ensure(parsed.sportEntries.length <= getSportEntryLimit(parsed.sport), sportType === "TEAM"
        ? "กีฬาแบบทีมเลือกประเภทหรือรุ่นแข่งขันได้เพียง 1 รายการ"
        : "กีฬาแบบเดี่ยวเลือกประเภทหรือรุ่นแข่งขันได้ไม่เกิน 4 รายการ", 400);
      ensure(parsed.sportEntries.every(e => competition.quotas.some(q => q.sport === e.sport)), "กีฬาในใบสมัครไม่อยู่ในการแข่งขัน");
      const declaredCount = user.profile.studentLevel === "GRADUATE" ? parsed.previousGraduateCount : parsed.previousBachelorCount;
      assertAthleteEligibility(user.profile, quota, competition.year, declaredCount);
      const existing = await tx.application.findUnique({ where: { userId_competitionId_sport: { userId: user.id, competitionId: competition.id, sport: parsed.sport } } });
      ensure(!existing, "สมัครกีฬานี้ในการแข่งขันนี้แล้ว", 409);

      const club = await validateApplicationClub(tx, { ...parsed, noClubFileUrl: input.noClubFileUrl });

      const docCheck = checkAthleteRequiredDocuments(input, null);
      if (!docCheck.hasAllRequired) {
        const missingLabels = docCheck.missingDocuments.map(d => d.label).join(", ");
        ensure(false, "กรุณาแนบเอกสารบังคับให้ครบถ้วน: " + missingLabels, 400);
      }

      await retainAthleteDocuments(tx, input, user.id);
      await retainCompetitionResultDocuments(tx, parsed.competitionResults, user.id);
      const application = await tx.application.create({ data: {
        userId: user.id, competitionId: competition.id, sport: parsed.sport, category: parsed.category,
        division: parsed.division, note: encodeClubNote(parsed.note, null), supervisorName: parsed.supervisorName, supervisorPosition: parsed.supervisorPosition,
        clubId: club?.id ?? null,
        status: "SUBMITTED",
        photoFileUrl: input.photoFileUrl as string, idCardFileUrl: input.idCardFileUrl as string,
        studentCardFileUrl: input.studentCardFileUrl as string, studentCertFileUrl: input.studentCertFileUrl as string,
        upAcademyFileUrl: (input.upAcademyFileUrl as string | null | undefined) ?? "",
        fitnessTestFileUrl: (input.fitnessTestFileUrl as string | null | undefined) ?? "",
        noClubFileUrl: input.noClubFileUrl ? input.noClubFileUrl as string : null,
        statusHistory: { create: { status: "SUBMITTED", label: "ส่งใบสมัคร", by: session.id } },
        sportEntries: { create: parsed.sportEntries }, competitionResults: { create: parsed.competitionResults },
      }, include: { statusHistory: true, sportEntries: true, competitionResults: true } });
      return { application: protectedApplication(application), message: "ส่งใบสมัครสำเร็จ" };
    });
  });
  return response.status === 200 ? new Response(response.body, { status: 201, headers: response.headers }) : response;
}
