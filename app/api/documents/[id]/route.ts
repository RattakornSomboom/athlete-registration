import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { api, atomic, ensure } from "@/lib/phase4-server";
import { canReadDocument, PRIVATE_BUCKET } from "@/lib/document-service";
type Context = { params: Promise<{ id: string }> };
const ROLES = ["CLUB", "TEAM_OFFICIAL", "STAFF", "ADMIN", "SUPERADMIN"];
export async function GET(request: Request, context: Context) {
  return api(request, ROLES, async session => {
    const { id } = await context.params;
    const doc = await prisma.privateDocument.findUnique({ where: { id } });
    ensure(doc?.state === "READY", "ไม่พบเอกสาร", 404);
    ensure(await canReadDocument(session, doc), "ไม่มีสิทธิ์อ่านเอกสาร", 403);
    const { data, error } = await supabaseAdmin.storage.from(PRIVATE_BUCKET).createSignedUrl(doc.path, 60);
    ensure(!error && data, "เปิดเอกสารไม่ได้", 502);
    return { url: data.signedUrl, name: doc.name };
  });
}
export async function DELETE(request: Request, context: Context) {
  return api(request, ROLES, async session => {
    const { id } = await context.params;
    const doc = await atomic(async tx => {
      const d = await tx.privateDocument.findUnique({ where: { id } });
      ensure(d, "ไม่พบเอกสาร", 404);
      ensure(d.ownerId === session.id && d.ownerRole === session.role && !d.retained, "ลบได้เฉพาะไฟล์ร่างของตัวเอง", 403);
      ensure(d.state !== "DELETED", "ไม่พบเอกสาร", 404);
      return tx.privateDocument.update({ where: { id }, data: { state: "DELETING" } });
    });
    const { error } = await supabaseAdmin.storage.from(PRIVATE_BUCKET).remove([doc.path]);
    ensure(!error, "ลบไฟล์ไม่สำเร็จ ลองใหม่ได้", 502);
    await prisma.privateDocument.update({ where: { id }, data: { state: "DELETED" } });
    return { success: true };
  });
}

