import { api, atomic, body, ensure, ownedDocument, string } from "@/lib/phase4-server";
import { documentId } from "@/lib/athlete-document-policy";
import { canAthleteDecide } from "@/lib/athlete-decision-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  return api(request, ["ATHLETE"], async session => {
    const { id } = await params;
    const data = await body(request);
    const action = string(data.action, "action");
    ensure(action === "CONFIRM" || action === "DECLINE", "การดำเนินการไม่ถูกต้อง");
    const reason = action === "DECLINE" ? string(data.reason, "เหตุผลที่สละสิทธิ์", 1000) : null;
    ensure(action !== "CONFIRM" || data.acceptedTerms === true, "กรุณารับทราบหน้าที่และเงื่อนไขก่อนยืนยันสิทธิ์");
    ensure(data.evidenceUrl == null || typeof data.evidenceUrl === "string", "เอกสารหลักฐานไม่ถูกต้อง");
    const evidenceUrl = typeof data.evidenceUrl === "string" && data.evidenceUrl ? data.evidenceUrl : null;
    ensure(!evidenceUrl || action === "DECLINE", "แนบหลักฐานได้เฉพาะการสละสิทธิ์");

    return atomic(async tx => {
      const application = await tx.application.findUnique({
        where: { id },
        include: { statusHistory: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
      });
      ensure(application, "ไม่พบใบสมัคร", 404);
      ensure(application.userId === session.id, "ไม่มีสิทธิ์", 403);
      ensure(canAthleteDecide(application), "ยังไม่ประกาศผลหรือดำเนินการยืนยัน/สละสิทธิ์แล้ว กรุณาโหลดข้อมูลใหม่", 409);
      if (evidenceUrl) {
        const evidenceId = documentId(evidenceUrl);
        ensure(evidenceId, "เอกสารหลักฐานไม่ถูกต้อง");
        const document = await ownedDocument(tx, evidenceId, session.id, "ATHLETE");
        ensure(document.ownerRole === "ATHLETE", "เอกสารไม่ใช่ของนักกีฬา", 403);
        await tx.privateDocument.update({ where: { id: evidenceId }, data: { retained: true } });
      }
      const label = action === "CONFIRM"
        ? "ยืนยันสิทธิ์การเป็นตัวแทนมหาวิทยาลัย พร้อมรับทราบหน้าที่ การฝึกซ้อม ระเบียบ และกำหนดการแข่งขัน"
        : "สละสิทธิ์การเป็นตัวแทนมหาวิทยาลัย: " + reason + (evidenceUrl ? " (มีเอกสารแนบ: " + evidenceUrl + ")" : "");
      await tx.application.update({
        where: { id },
        data: {
          statusHistory: {
            create: {
              status: action === "CONFIRM" ? "ATHLETE_CONFIRMED" : "ATHLETE_DECLINED",
              label,
              by: session.id,
            },
          },
        },
      });
      return { message: action === "CONFIRM" ? "ยืนยันสิทธิ์สำเร็จ" : "บันทึกการสละสิทธิ์สำเร็จ" };
    });
  });
}
