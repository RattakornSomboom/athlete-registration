import type { JWTPayload } from "@/lib/auth";
import { atomic, ensure, json, openCompetition, ownedDocument, string, version } from "@/lib/phase4-server";
import { canReviewOfficial, DOCUMENT_FIELDS, EDITABLE_OFFICIAL, officialProfileValid, PROFILE_FIELDS } from "@/lib/phase4-policy";
export async function saveOfficial(session: JWTPayload, data: Record<string, unknown>) {
  const competitionId = string(data.competitionId, "competitionId");
  const clubId = string(data.clubId, "clubId");
  const expected = version(data.version);
  ensure(data.action === "save" || data.action === "submit", "action ไม่ถูกต้อง");
  const profile: Record<string, string> = {};
  ensure(data.profile && typeof data.profile === "object", "ข้อมูลประวัติไม่ถูกต้อง");
  for (const key of PROFILE_FIELDS) {
    const value = (data.profile as Record<string, unknown>)[key] ?? "";
    ensure(typeof value === "string" && value.length <= 1000, "ข้อมูลประวัติไม่ถูกต้อง");
    profile[key] = value.trim();
  }
  const documents: Record<string, string> = {};
  ensure(data.documents && typeof data.documents === "object", "ข้อมูลเอกสารไม่ถูกต้อง");
  for (const key of DOCUMENT_FIELDS) {
    const value = (data.documents as Record<string, unknown>)[key];
    if (value) documents[key] = string(value, "documentId");
  }
  const submit = data.action === "submit";
  if (submit) ensure(officialProfileValid(profile) && documents.plan && documents.idCard && data.acceptedRules === true, "กรอกข้อมูล แนบเอกสารบังคับ และยอมรับเงื่อนไขให้ครบ");
  return atomic(async tx => {
    const competition = await openCompetition(tx, competitionId);
    const club = await tx.club.findUnique({ where: { id: clubId } });
    ensure(club?.isActive && competition.quotas.some(q => q.sport === club.sport), "ชมรมไม่อยู่ในรายการแข่งขัน", 400);
    const old = await tx.officialApplication.findUnique({ where: { userId_competitionId: { userId: session.id, competitionId } } });
    ensure((old?.version ?? 0) === expected && (!old || EDITABLE_OFFICIAL.includes(old.status)), "ใบสมัครถูกล็อกหรือ version เปลี่ยน", 409);
    for (const id of Object.values(documents)) {
      await ownedDocument(tx, id, session.id, "OFFICIAL");
      if (submit) await tx.privateDocument.update({ where: { id }, data: { retained: true } });
    }
    const status = submit ? "SUBMITTED" : old?.status ?? "DRAFT";
    const fields = { clubId, profile: json(profile), documents: json(documents), status };
    const app = old
      ? await tx.officialApplication.update({ where: { id: old.id }, data: { ...fields, version: { increment: 1 } } })
      : await tx.officialApplication.create({ data: { ...fields, userId: session.id, competitionId, version: 1 } });
    await tx.officialEvent.create({ data: { applicationId: app.id, action: submit ? "SUBMITTED" : "SAVED", actorId: session.id, payload: json({ profile, documents, clubId, acceptedRules: submit }) } });
    return { application: app };
  });
}
export async function reviewOfficial(session: JWTPayload, data: Record<string, unknown>) {
  const id = string(data.id, "id");
  const expected = version(data.version);
  ensure(
    data.action === "approve" || data.action === "reject" || data.action === "document-review",
    "action ไม่ถูกต้อง",
  );
  const documentReview = data.action === "document-review";
  const reject = data.action === "reject";
  const documentId = documentReview ? string(data.documentId, "documentId") : null;
  const decision = documentReview ? data.decision : null;
  ensure(!documentReview || decision === "approve" || decision === "return", "ผลการตรวจเอกสารไม่ถูกต้อง");
  const reason = reject || (documentReview && decision === "return")
    ? string(data.reason, "เหตุผล", 2000)
    : typeof data.reason === "string" && data.reason.trim()
      ? string(data.reason, "ความเห็น", 2000)
      : null;
  return atomic(async tx => {
    const app = await tx.officialApplication.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: "desc" } } },
    });
    ensure(app, "ไม่พบใบสมัคร", 404);
    ensure(session.role !== "CLUB" || session.clubId === app.clubId, "ไม่มีสิทธิ์", 403);
    if (documentReview) {
      ensure(session.role === "CLUB", "ไม่มีสิทธิ์", 403);
      ensure(app.version === expected && app.status === "SUBMITTED", "สถานะหรือ version เปลี่ยน กรุณาโหลดใหม่", 409);
      const documents = app.documents && typeof app.documents === "object" && !Array.isArray(app.documents)
        ? app.documents as Record<string, unknown>
        : {};
      const field = DOCUMENT_FIELDS.find(key => documents[key] === documentId);
      ensure(field, "ไม่พบเอกสารในใบสมัคร", 404);
      return {
        application: await tx.officialApplication.update({
          where: { id },
          data: {
            version: { increment: 1 },
            events: {
              create: {
                action: "DOCUMENT_REVIEWED",
                actorId: session.id,
                reason,
                payload: json({
                  documents,
                  documentReview: { field, documentId, status: decision },
                }),
              },
            },
          },
        }),
      };
    }
    ensure(app.version === expected && canReviewOfficial(session.role, app.status), "สถานะหรือ version เปลี่ยน กรุณาโหลดใหม่", 409);
    if (session.role === "CLUB" && !reject) {
      const documents = app.documents && typeof app.documents === "object" && !Array.isArray(app.documents)
        ? app.documents as Record<string, unknown>
        : {};
      ensure(
        typeof documents.plan === "string" && typeof documents.idCard === "string",
        "กรุณาแนบแผนการฝึกซ้อมและสำเนาบัตรประชาชน",
      );
      const latestReviews = new Map<string, { documentId: string; status: string }>();
      for (const event of app.events) {
        if (event.action !== "DOCUMENT_REVIEWED" || !event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) continue;
        const payload = event.payload as Record<string, unknown>;
        const review = payload.documentReview;
        if (!review || typeof review !== "object" || Array.isArray(review)) continue;
        const value = review as Record<string, unknown>;
        if (
          typeof value.field === "string" &&
          typeof value.documentId === "string" &&
          typeof value.status === "string" &&
          !latestReviews.has(value.field)
        ) {
          latestReviews.set(value.field, { documentId: value.documentId, status: value.status });
        }
      }
      ensure(
        DOCUMENT_FIELDS.every(field => {
          const document = documents[field];
          if (typeof document !== "string") return true;
          const review = latestReviews.get(field);
          return review?.documentId === document && review.status === "approve";
        }),
        "กรุณาตรวจอนุมัติเอกสารแนบทุกฉบับก่อนเสนอชื่อ",
      );
    }
    const status = session.role === "CLUB" ? (reject ? "CLUB_REJECTED" : "CLUB_APPROVED") : (reject ? "STAFF_REJECTED" : "STAFF_APPROVED");
    return { application: await tx.officialApplication.update({ where: { id }, data: {
      status, version: { increment: 1 },
      events: { create: { action: status, actorId: session.id, reason, payload: json({ documents: app.documents }) } },
    } }) };
  });
}
