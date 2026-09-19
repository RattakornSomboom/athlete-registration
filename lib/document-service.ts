import type { PrivateDocument } from "@prisma/client";
import type { JWTPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAFF } from "@/lib/phase4-server";
import { DOCUMENT_FIELDS } from "@/lib/phase4-policy";
export const PRIVATE_BUCKET = process.env.PRIVATE_DOCUMENT_BUCKET || "athlete-private";
export function validFileSignature(bytes: Uint8Array, mime: string) {
  if (mime === "application/pdf") return Buffer.from(bytes.subarray(0, 5)).toString() === "%PDF-";
  if (mime === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === "image/png") return Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  return false;
}
export async function canReadDocument(session: JWTPayload, doc: PrivateDocument) {
  if (doc.ownerId === session.id && doc.ownerRole === session.role) return true;
  if (!doc.retained) return false;
  if ((STAFF as readonly string[]).includes(session.role)) return true;
  if (session.role !== "CLUB" || !session.clubId) return false;
  const matches = DOCUMENT_FIELDS.map(key => ({ documents: { path: [key], equals: doc.id } }));
  const events = DOCUMENT_FIELDS.map(key => ({ payload: { path: ["documents", key], equals: doc.id } }));
  return !!await prisma.officialApplication.findFirst({ where: {
    clubId: session.clubId, OR: [...matches, { events: { some: { OR: events } } }],
  }, select: { id: true } });
}

