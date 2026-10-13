import { api, ApiError, atomic, body, ensure, string, STAFF } from "@/lib/phase4-server";
import { prisma } from "@/lib/prisma";
import { assertAthleteEligibility } from "@/lib/athlete-eligibility";
import { collectPublicationProblems } from "@/lib/publication-gate";
export async function GET(request: Request) {
  return api(request, STAFF, async () => {
    const competitionId = string(new URL(request.url).searchParams.get("competitionId"), "การแข่งขัน");
    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    ensure(competition, "ไม่พบการแข่งขัน", 404);
    const applications = await prisma.application.findMany({ where: { competitionId, status: "STAFF_APPROVED", OR: [{ noClubFileUrl: { not: null } }, { rosterItem: { roster: { status: "SUBMITTED" } } }] },
      select: { id: true, sport: true, user: { select: { studentId: true, profile: { select: { firstName: true, lastName: true } } } } }, orderBy: { id: "asc" } });
    const problems = await prisma.$transaction(tx => collectPublicationProblems(tx, competitionId, applications.map(a => a.id)));
    return { competitionId, applications, problems, canPublish: applications.length > 0 && problems.length === 0 };
  });
}
export async function POST(request: Request) {
  return api(request, STAFF, async session => {
    const data = await body(request);
    const competitionId = string(data.competitionId, "การแข่งขัน");
    const ids = data.applicationIds;
    ensure(Array.isArray(ids) && ids.length > 0 && ids.length <= 10000 && ids.every(id => typeof id === "string" && id.length > 0 && id.length <= 200), "กรุณาดูตัวอย่างและเลือกรายการก่อนประกาศผล");
    ensure(new Set(ids).size === ids.length, "รายการใบสมัครซ้ำ");
    return atomic(async tx => {
      ensure(await tx.competition.findUnique({ where: { id: competitionId } }), "ไม่พบการแข่งขัน", 404);
      const applications = await tx.application.findMany({
        where: { competitionId, status: "STAFF_APPROVED", id: { in: ids }, OR: [{ noClubFileUrl: { not: null } }, { rosterItem: { roster: { status: "SUBMITTED" } } }] },
        include: { rosterItem: { include: { roster: true } }, user: { include: { profile: true } }, competition: { include: { quotas: true } } },
      });
      ensure(applications.length === ids.length, "ใบสมัครต่างการแข่งขันหรือสถานะเปลี่ยนแล้ว กรุณาดูตัวอย่างใหม่", 409);
      const problems = await collectPublicationProblems(tx, competitionId, ids);
      if (problems.length) throw new ApiError(409, `ประกาศผลไม่ได้: พบ ${problems.length} รายการที่ยังไม่ผ่านเงื่อนไข`, problems);
      for (const application of applications) {
        ensure(application.competition, "ไม่พบการแข่งขัน", 404);
        assertAthleteEligibility(application.user?.profile, application.competition.quotas.find(quota => quota.sport === application.sport), application.competition.year);
      }
      const changed = await tx.application.updateMany({ where: { competitionId, status: "STAFF_APPROVED", id: { in: ids }, OR: [{ noClubFileUrl: { not: null } }, { rosterItem: { roster: { status: "SUBMITTED" } } }] }, data: { status: "FINAL_SELECTED" } });
      ensure(changed.count === ids.length, "ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่", 409);
      await tx.statusHistory.createMany({ data: applications.map(a => ({ applicationId: a.id, status: "FINAL_SELECTED", label: "ประกาศผลการคัดเลือก", by: session.id })) });
      return { message: "ประกาศผลสำเร็จ", count: changed.count, competitionId };
    });
  });
}
