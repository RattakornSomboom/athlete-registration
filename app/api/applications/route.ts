import { api, atomic, body, ensure } from "@/lib/phase4-server";
import { athleteApplicationInput } from "@/lib/validation";
import { retainAthleteDocuments, assertPrivateBucket } from "@/lib/document-service";
import { protectedApplication } from "@/lib/athlete-document-policy";
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
        fitnessTestResult: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications: applications.map(({ rosterItem, ...application }) => ({ ...protectedApplication(application), rosterClub: rosterItem?.roster.club ?? null })) });
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
      ensure(parsed.sportEntries.every(e => competition.quotas.some(q => q.sport === e.sport)), "กีฬาในใบสมัครไม่อยู่ในการแข่งขัน");
      const age = new Date().getFullYear() - user.profile.birthDate.getFullYear();
      ensure(age >= 0 && age <= (quota.ageLimit ?? 28), "อายุไม่ผ่านเกณฑ์การแข่งขัน");
      ensure(parsed.previousBachelorCount + parsed.previousGraduateCount < (user.profile.studentLevel === "GRADUATE" ? 3 : 5), "จำนวนครั้งที่เข้าร่วมเกินเกณฑ์");
      const existing = await tx.application.findUnique({ where: { userId_competitionId_sport: { userId: user.id, competitionId: competition.id, sport: parsed.sport } } });
      ensure(!existing, "สมัครกีฬานี้ในการแข่งขันนี้แล้ว", 409);
      await retainAthleteDocuments(tx, input, user.id);
      const application = await tx.application.create({ data: {
        userId: user.id, competitionId: competition.id, sport: parsed.sport, category: parsed.category,
        division: parsed.division, note: parsed.note, supervisorName: parsed.supervisorName, supervisorPosition: parsed.supervisorPosition,
        status: "SUBMITTED",
        photoFileUrl: input.photoFileUrl as string, idCardFileUrl: input.idCardFileUrl as string,
        studentCardFileUrl: input.studentCardFileUrl as string, studentCertFileUrl: input.studentCertFileUrl as string,
        upAcademyFileUrl: input.upAcademyFileUrl as string, fitnessTestFileUrl: input.fitnessTestFileUrl as string,
        noClubFileUrl: input.noClubFileUrl ? input.noClubFileUrl as string : null,
        statusHistory: { create: { status: "SUBMITTED", label: "ส่งใบสมัคร", by: session.id } },
        sportEntries: { create: parsed.sportEntries }, competitionResults: { create: parsed.competitionResults },
      }, include: { statusHistory: true, sportEntries: true, competitionResults: true } });
      return { application: protectedApplication(application), message: "ส่งใบสมัครสำเร็จ" };
    });
  });
  return response.status === 200 ? new Response(response.body, { status: 201, headers: response.headers }) : response;
}
