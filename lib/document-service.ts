import type { PrivateDocument } from "@prisma/client";
import type { JWTPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAFF } from "@/lib/phase4-server";
import { DOCUMENT_FIELDS } from "@/lib/phase4-policy";
import { ATHLETE_DOCUMENT_FIELDS, REQUIRED_ATHLETE_DOCUMENTS } from "@/lib/athlete-document-policy";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ensure, type Tx } from "@/lib/phase4-server";
import { documentId } from "@/lib/athlete-document-policy";
import { requiredServerEnv } from "@/lib/server-env";

export const PRIVATE_BUCKET = requiredServerEnv("PRIVATE_DOCUMENT_BUCKET");
export const documentOwner = (session: JWTPayload) => session.role === "CLUB" ? session.clubId! : session.id;
export async function assertPrivateBucket(bucket = PRIVATE_BUCKET) {
  const { data, error } = await supabaseAdmin.storage.getBucket(bucket);
  ensure(!error && data && !data.public, "พื้นที่เอกสารส่วนตัวยังไม่พร้อมใช้งาน", 503);
}
export async function retainAthleteDocuments(tx: Tx, values: Record<string, unknown>, ownerId: string, partial = false) {
  for (const field of ATHLETE_DOCUMENT_FIELDS) {
    if (partial && values[field] === undefined) continue;
    const value = values[field];
    if ((value === undefined || value === null || value === "") && !REQUIRED_ATHLETE_DOCUMENTS.includes(field)) continue;
    const id = documentId(value);
    ensure(id, "กรุณาอัปโหลดเอกสารผ่านระบบเอกสารส่วนตัว");
    const doc = await tx.privateDocument.findUnique({ where: { id } });
    ensure(doc?.state === "READY" && doc.ownerRole === "ATHLETE" && doc.ownerId === ownerId && doc.purpose === "ATHLETE", "เอกสารไม่ถูกต้องหรือไม่ใช่ของผู้สมัคร", 403);
    await tx.privateDocument.update({ where: { id }, data: { retained: true } });
  }
}
export async function retainCompetitionResultDocuments(
  tx: Tx,
  results: { evidenceFileUrl: string | null }[],
  ownerId: string,
) {
  for (const result of results) {
    if (!result.evidenceFileUrl) continue;
    const id = documentId(result.evidenceFileUrl);
    ensure(id, "กรุณาอัปโหลดรูปหลักฐานผลงานผ่านระบบเอกสารส่วนตัว");
    const doc = await tx.privateDocument.findUnique({ where: { id } });
    ensure(
      doc?.state === "READY" && doc.ownerRole === "ATHLETE" && doc.ownerId === ownerId && doc.purpose === "ATHLETE" && ["image/jpeg", "image/png"].includes(doc.mimeType),
      "รูปหลักฐานผลงานไม่ถูกต้องหรือไม่ใช่ของผู้สมัคร",
      403,
    );
    await tx.privateDocument.update({ where: { id }, data: { retained: true } });
  }
}
export function validFileSignature(bytes: Uint8Array, mime: string) {
  if (mime === "application/pdf") return Buffer.from(bytes.subarray(0, 5)).toString() === "%PDF-";
  if (mime === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === "image/png") return Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  return false;
}
export async function canReadDocument(session: JWTPayload, doc: PrivateDocument) {
  if (doc.ownerId === documentOwner(session) && doc.ownerRole === session.role) return true;
  if (!doc.retained) return false;
  if ((STAFF as readonly string[]).includes(session.role)) return true;
  if (session.role !== "CLUB" || !session.clubId) return false;
  if (doc.purpose === "ATHLETE") {
    const club = await prisma.club.findUnique({ where: { id: session.clubId } });
    if (!club?.isActive) return false;
      // CLUB can review retained athlete documents belonging to its club before roster selection.
    const reference = `/api/documents/${doc.id}/download`;
    return !!await prisma.application.findFirst({ where: {
        clubId: club.id,
      OR: [
        ...ATHLETE_DOCUMENT_FIELDS.map(field => ({ [field]: reference })),
        { competitionResults: { some: { evidenceFileUrl: reference } } },
      ],
    }, select: { id: true } });
  }
  const matches = DOCUMENT_FIELDS.map(key => ({ documents: { path: [key], equals: doc.id } }));
  const events = DOCUMENT_FIELDS.map(key => ({ payload: { path: ["documents", key], equals: doc.id } }));
  return !!await prisma.officialApplication.findFirst({ where: {
    clubId: session.clubId, OR: [...matches, { events: { some: { OR: events } } }],
  }, select: { id: true } });
}
