import { prisma } from "@/lib/prisma";
import { api, ensure } from "@/lib/phase4-server";
import { applicationWhere } from "@/lib/application-query";
import { ATHLETE_DOCUMENT_FIELDS, documentId } from "@/lib/athlete-document-policy";
import { assertPrivateBucket } from "@/lib/document-service";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GET as downloadDocument } from "@/app/api/documents/[id]/download/route";

export async function GET(request: Request, context: { params: Promise<{ id: string; field: string }> }) {
  let redirect: Response | undefined;
  const response = await api(request, ["ATHLETE", "CLUB", "STAFF", "ADMIN"], async session => {
    const { id, field } = await context.params;
    const key = ATHLETE_DOCUMENT_FIELDS.find(f => f === field);
    ensure(key, "ไม่พบเอกสาร", 404);
    const scope = session.role === "ATHLETE" ? { userId: session.id } : await applicationWhere(session, new URLSearchParams());
    const application = await prisma.application.findFirst({ where: { AND: [{ id }, scope] } });
    ensure(application, "ไม่พบเอกสารหรือไม่มีสิทธิ์", 404);
    const reference = application[key];
    ensure(reference, "ไม่พบเอกสาร", 404);
    const docId = documentId(reference);
    if (docId) {
      redirect = await downloadDocument(request, { params: Promise.resolve({ id: docId }) });
      return {};
    }
    // Keep legacy references in the DB, but never redirect to a public URL.
    const url = new URL(reference);
    const origin = new URL(process.env.SUPABASE_URL!).origin;
    const prefix = "/storage/v1/object/public/athlete-docs/";
    ensure(url.origin === origin && url.pathname.startsWith(prefix), "เอกสารเดิมต้องได้รับการตรวจสอบก่อนใช้งาน", 409);
    await assertPrivateBucket("athlete-docs");
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    const { data, error } = await supabaseAdmin.storage.from("athlete-docs").createSignedUrl(path, 60);
    ensure(!error && data, "เปิดเอกสารไม่ได้", 502);
    redirect = new Response(null, { status: 302, headers: { Location: data.signedUrl, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
    return {};
  });
  return response.ok && redirect ? redirect : response;
}
