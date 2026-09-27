import { api, atomic, body, ensure, string, STAFF } from "@/lib/phase4-server";
import { prisma } from "@/lib/prisma";
export async function GET(request: Request) {
  return api(request, STAFF, async () => {
    const competitionId = string(new URL(request.url).searchParams.get("competitionId"), "การแข่งขัน");
    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    ensure(competition, "ไม่พบการแข่งขัน", 404);
    const applications = await prisma.application.findMany({ where: { competitionId, status: "STAFF_APPROVED" },
      select: { id: true, sport: true, user: { select: { studentId: true, profile: { select: { firstName: true, lastName: true } } } } }, orderBy: { id: "asc" } });
    return { competitionId, applications };
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
        where: { competitionId, status: "STAFF_APPROVED", id: { in: ids } },
        include: { rosterItem: { include: { roster: true } } },
      });
      ensure(applications.length === ids.length, "ใบสมัครต่างการแข่งขันหรือสถานะเปลี่ยนแล้ว กรุณาดูตัวอย่างใหม่", 409);
      ensure(applications.every(a => !a.rosterItem || a.rosterItem.roster.status === "SUBMITTED"), "บัญชีชมรมยังไม่ถูกส่ง", 409);
      const changed = await tx.application.updateMany({ where: { competitionId, status: "STAFF_APPROVED", id: { in: ids } }, data: { status: "FINAL_SELECTED" } });
      ensure(changed.count === ids.length, "ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่", 409);
      await tx.statusHistory.createMany({ data: applications.map(a => ({ applicationId: a.id, status: "FINAL_SELECTED", label: "ประกาศผลการคัดเลือก", by: session.id })) });
      return { message: "ประกาศผลสำเร็จ", count: changed.count, competitionId };
    });
  });
}
