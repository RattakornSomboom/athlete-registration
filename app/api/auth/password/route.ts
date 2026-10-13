import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, credentialVersion } from "@/lib/auth";
import { atomic, body, ensure, ApiError } from "@/lib/phase4-server";
import { ValidationError } from "@/lib/validation";
import { recordAudit } from "@/lib/audit-service";

export async function PUT(request: Request) {
  try {
    const session = await getSession(request as NextRequest, true);
    ensure(session, "กรุณาเข้าสู่ระบบ", 401);
    const { oldPassword, newPassword, confirmPassword } = await body(request);
    ensure(typeof oldPassword === "string" && typeof newPassword === "string", "กรุณาระบุรหัสผ่านเดิมและรหัสผ่านใหม่");
    ensure(newPassword.length >= 8 && Buffer.byteLength(newPassword, "utf8") <= 72, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร และไม่เกิน 72 ไบต์");
    ensure(confirmPassword === undefined || confirmPassword === newPassword, "รหัสผ่านไม่ตรงกัน");
    const password = await bcrypt.hash(newPassword, 12);
    await atomic(async tx => {
      const legacyClub = session.role === "CLUB" && session.id === session.clubId;
      const account = legacyClub ? await tx.club.findUnique({ where: { id: session.id } }) : await tx.user.findUnique({ where: { id: session.id } });
      ensure(account?.isActive, "บัญชีไม่พร้อมใช้งาน", 403);
      ensure(session.credentialVersion === credentialVersion(account.password), "กรุณาเข้าสู่ระบบใหม่", 401);
      ensure(await bcrypt.compare(oldPassword, account.password), "รหัสผ่านเดิมไม่ถูกต้อง");
      ensure(!(await bcrypt.compare(newPassword, account.password)), "รหัสผ่านใหม่ต้องต่างจากรหัสผ่านเดิม");
      const data = { password, mustChangePassword: false };
      if (legacyClub) await tx.club.update({ where: { id: session.id }, data });
      else await tx.user.update({ where: { id: session.id }, data });
      await recordAudit(tx, { actorId: session.id, entityId: session.id, entityType: legacyClub ? "CLUB" : "USER", action: "PASSWORD_CHANGED" });
    });
    const response = NextResponse.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่" }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.delete("token");
    response.cookies.delete("role");
    return response;
  } catch (error) {
    if (error instanceof ApiError || error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: error instanceof ApiError ? error.status : 400 });
    return NextResponse.json({ error: "ไม่สามารถเปลี่ยนรหัสผ่านได้" }, { status: 500 });
  }
}
