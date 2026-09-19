import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { api, ensure } from "@/lib/phase4-server";
import { PRIVATE_BUCKET, validFileSignature } from "@/lib/document-service";
export async function POST(request: Request) {
  return api(request, ["CLUB", "TEAM_OFFICIAL"], async session => {
    const form = await request.formData();
    const file = form.get("file");
    const purpose = session.role === "CLUB" ? "ROSTER" : "OFFICIAL";
    ensure(file instanceof File && file.size > 0 && file.size <= 5 * 1024 * 1024, "ไฟล์ต้องมีขนาดไม่เกิน 5 MB");
    const bytes = new Uint8Array(await file.arrayBuffer());
    ensure(validFileSignature(bytes, file.type), "รองรับ PDF, JPEG และ PNG ที่ถูกต้องเท่านั้น");
    const path = session.id + "/" + randomUUID();
    const { error } = await supabaseAdmin.storage.from(PRIVATE_BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
    ensure(!error, "อัปโหลดไม่สำเร็จ กรุณาลองใหม่", 502);
    try {
      const doc = await prisma.privateDocument.create({ data: {
        ownerId: session.id, ownerRole: session.role, purpose, path,
        name: file.name.slice(0, 200), mimeType: file.type, size: file.size,
      } });
      return { document: { id: doc.id, name: doc.name, size: doc.size } };
    } catch (error) {
      await supabaseAdmin.storage.from(PRIVATE_BUCKET).remove([path]);
      throw error;
    }
  });
}

