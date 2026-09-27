import { prisma } from "@/lib/prisma";
import { api, atomic, body, ensure } from "@/lib/phase4-server";
import { competitionInput } from "@/lib/validation";
import { NextResponse } from "next/server";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const competition = await prisma.competition.findUnique({ where: { id }, include: { quotas: true, _count: { select: { applications: true } } } });
  return competition ? NextResponse.json({ competition }) : NextResponse.json({ error: "ไม่พบการแข่งขัน" }, { status: 404 });
}
export async function PATCH(request: Request, context: Context) {
  return api(request, ["ADMIN"], async () => {
    const { id } = await context.params;
    const { quotas, ...data } = competitionInput(await body(request), true);
    return atomic(async tx => {
      const current = await tx.competition.findUnique({ where: { id }, include: { quotas: true } });
      ensure(current, "ไม่พบการแข่งขัน", 404);
      const nextQuotas = quotas ?? current.quotas;
      ensure((data.status ?? current.status) !== "OPEN" || nextQuotas.length, "กำหนดกีฬาก่อนเปิดรับสมัคร");
      if (quotas) {
        const used = await tx.application.findMany({ where: { competitionId: id }, select: { sport: true }, distinct: ["sport"] });
        ensure(used.every(a => quotas.some(q => q.sport === a.sport)), "ลบกีฬาที่มีผู้สมัครแล้วไม่ได้", 409);
        await tx.sportQuota.deleteMany({ where: { competitionId: id } });
        await tx.sportQuota.createMany({ data: quotas.map(q => ({ ...q, competitionId: id })) });
      }
      return { competition: await tx.competition.update({ where: { id }, data, include: { quotas: true } }) };
    });
  });
}
export async function DELETE(request: Request, context: Context) {
  return api(request, ["ADMIN"], async () => {
    const { id } = await context.params;
    return atomic(async tx => {
      const c = await tx.competition.findUnique({ where: { id }, include: { _count: { select: { applications: true, rosters: true, officialApplications: true } } } });
      ensure(c, "ไม่พบการแข่งขัน", 404);
      ensure(!c._count.applications && !c._count.rosters && !c._count.officialApplications, "มีข้อมูลสมัครแล้ว ให้ปิดรับสมัครแทน", 409);
      await tx.competition.delete({ where: { id } });
      return { message: "ลบการแข่งขันแล้ว" };
    });
  });
}
