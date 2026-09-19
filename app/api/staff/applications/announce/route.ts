import { api, atomic, body, ensure, STAFF } from "@/lib/phase4-server";
export async function POST(request: Request) {
  return api(request, STAFF, async session => {
    const data = await body(request);
    const ids = data.applicationIds;
    ensure(ids === undefined || (Array.isArray(ids) && ids.length > 0 && ids.every(id => typeof id === "string")), "applicationIds ไม่ถูกต้อง");
    return atomic(async tx => {
      const applications = await tx.application.findMany({
        where: { status: "STAFF_APPROVED", ...(Array.isArray(ids) ? { id: { in: ids as string[] } } : {}) },
        include: { rosterItem: { include: { roster: true } } },
      });
      ensure(applications.length, "ไม่มีใบสมัครที่รอประกาศผล");
      ensure(applications.every(a => !a.rosterItem || a.rosterItem.roster.status === "SUBMITTED"), "บัญชีชมรมยังไม่ถูกส่ง", 409);
      const selected = applications.map(a => a.id);
      await tx.application.updateMany({ where: { id: { in: selected } }, data: { status: "FINAL_SELECTED" } });
      await tx.statusHistory.createMany({ data: selected.map(applicationId => ({ applicationId, status: "FINAL_SELECTED", label: "ประกาศผลการคัดเลือก", by: session.id })) });
      return { message: "ประกาศผลสำเร็จ " + selected.length + " ใบสมัคร", count: selected.length };
    });
  });
}
