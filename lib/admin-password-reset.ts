import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { atomic, ensure } from "@/lib/phase4-server";
import { recordAudit } from "@/lib/audit-service";

export async function resetAccountPassword(actorId: string, id: string, kind: "USER" | "CLUB", input: Record<string, unknown>) {
  ensure(input.identityVerified === true, "กรุณายืนยันตัวผู้แจ้งก่อนรีเซ็ตรหัสผ่าน");
  ensure(actorId !== id, "ใช้เมนูเปลี่ยนรหัสผ่านสำหรับบัญชีของตนเอง", 403);
  const temporaryPassword = randomBytes(18).toString("base64url");
  const password = await bcrypt.hash(temporaryPassword, 12);
  await atomic(async tx => {
    const account = kind === "USER" ? await tx.user.findUnique({ where: { id } }) : await tx.club.findUnique({ where: { id } });
    ensure(account, "ไม่พบบัญชีผู้ใช้", 404);
    const data = { password, mustChangePassword: true };
    if (kind === "USER") await tx.user.update({ where: { id }, data });
    else await tx.club.update({ where: { id }, data });
    await recordAudit(tx, { actorId, entityId: id, entityType: kind, action: "ADMIN_RESET_PASSWORD", details: { identityVerified: true } });
  });
  return { temporaryPassword, message: "ออกรหัสผ่านชั่วคราวแล้ว แสดงเพียงครั้งนี้" };
}
