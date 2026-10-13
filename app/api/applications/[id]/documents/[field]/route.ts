import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { api, ensure } from "@/lib/phase4-server";
import { applicationWhere } from "@/lib/application-query";
import { ATHLETE_DOCUMENT_FIELDS, documentId } from "@/lib/athlete-document-policy";
import { assertPrivateBucket } from "@/lib/document-service";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GET as downloadDocument } from "@/app/api/documents/[id]/download/route";
import { requiredServerEnv } from "@/lib/server-env";

export async function GET(request: Request, context: { params: Promise<{ id: string; field: string }> }) {
  let redirect: Response | undefined;
  const response = await api(request, ["ATHLETE", "CLUB", "STAFF", "ADMIN"], async session => {
    const { id, field } = await context.params;
    const key = ATHLETE_DOCUMENT_FIELDS.find(f => f === field);
    ensure(key, "ไม่พบเอกสาร", 404);
    let scope: Prisma.ApplicationWhereInput;
    if (session.role === "ATHLETE") {
      scope = { userId: session.id };
    } else if (session.role === "CLUB") {
      ensure(session.clubId, "ไม่พบข้อมูลชมรม", 403);
      const club = await prisma.club.findUnique({ where: { id: session.clubId } });
      ensure(club?.isActive, "ไม่พบชมรมที่ใช้งานได้", 403);
      scope = {
        clubId: club.id,
      };
    } else {
      scope = await applicationWhere(session, new URLSearchParams());
    }
    const application = await prisma.application.findFirst({ where: { AND: [{ id }, scope] } });
    ensure(application, "ไม่พบเอกสารหรือไม่มีสิทธิ์", 404);
    const reference = application[key];
    ensure(reference && reference !== "-", "ไม่พบเอกสาร", 404);
    const docId = documentId(reference);
    if (docId) {
      redirect = await downloadDocument(request, { params: Promise.resolve({ id: docId }) });
      return {};
    }
    // Handle external documents (e.g. Google Drive URLs from imported form responses)
    if (reference.startsWith("https://drive.google.com") || reference.startsWith("http://drive.google.com")) {
      redirect = new Response(null, {
        status: 302,
        headers: {
          Location: reference,
          "Cache-Control": "private, no-store",
          "Referrer-Policy": "no-referrer",
        },
      });
      return {};
    }
    // Keep legacy references in the DB, but never redirect to a public URL.
    const url = new URL(reference);
    const origin = new URL(requiredServerEnv("SUPABASE_URL")).origin;
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
