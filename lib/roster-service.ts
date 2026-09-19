import { prisma } from "@/lib/prisma";
import type { JWTPayload } from "@/lib/auth";
import { atomic, ensure, json, openCompetition, ownedDocument, string, version } from "@/lib/phase4-server";
import { withinQuota } from "@/lib/phase4-policy";
export async function saveRoster(session: JWTPayload, data: Record<string, unknown>) {
  ensure(session.clubId, "ไม่พบชมรม", 403);
  const clubId = session.clubId;
  const competitionId = string(data.competitionId, "competitionId");
  const expected = version(data.version);
  const submit = data.action === "submit";
  ensure(submit || data.action === "save", "action ไม่ถูกต้อง");
  ensure(Array.isArray(data.items) && data.items.length <= 1000, "รายการไม่ถูกต้อง");
  const items = data.items.map((i: unknown) => {
    ensure(i && typeof i === "object", "รายการไม่ถูกต้อง");
    const row = i as Record<string, unknown>;
    ensure(row.squadType === "main" || row.squadType === "reserve", "ประเภทนักกีฬาไม่ถูกต้อง");
    return { applicationId: string(row.applicationId, "applicationId"), squadType: row.squadType as string };
  });
  ensure(new Set(items.map(i => i.applicationId)).size === items.length, "มีรายการซ้ำ");
  return atomic(async tx => {
    const club = await tx.club.findUnique({ where: { id: clubId } });
    ensure(club?.isActive, "ชมรมถูกปิด", 403);
    const competition = await openCompetition(tx, competitionId);
    const quotas = competition.quotas.filter(q => q.sport === club.sport);
    ensure(quotas.length === 1, "ต้องมีโควตากีฬาที่ไม่ซ้ำก่อนจัดบัญชี", 409);
    const old = await tx.clubRoster.findUnique({ where: { clubId_competitionId: { clubId, competitionId } }, include: { items: true } });
    ensure((old?.version ?? 0) === expected && old?.status !== "SUBMITTED", "บัญชีถูกล็อกหรือ version เปลี่ยน กรุณาโหลดใหม่", 409);
    const apps = await tx.application.findMany({ where: { id: { in: items.map(i => i.applicationId) } }, include: { rosterItem: true } });
    ensure(apps.length === items.length && apps.every(a => a.competitionId === competitionId && a.sport === club.sport && (!a.rosterItem || a.rosterItem.rosterId === old?.id)), "มีใบสมัครนอกขอบเขตชมรม", 403);
    ensure(apps.every(a => ["SUBMITTED", "CLUB_APPROVED"].includes(a.status)), "มีใบสมัครที่พิจารณาแล้วหรือถูกปฏิเสธ", 409);
    const documentId = typeof data.documentId === "string" && data.documentId ? data.documentId : null;
    if (documentId) await ownedDocument(tx, documentId, clubId, "ROSTER");
    if (submit) {
      ensure(items.length > 0 && data.advisorApproved === true && documentId, "ต้องเลือกรายชื่อ ยืนยัน และแนบเอกสารลงนาม");
      const other = await tx.rosterItem.findMany({ where: { roster: { competitionId, status: "SUBMITTED", NOT: { clubId } }, application: { sport: club.sport } } });
      const combined = [...items, ...other];
      ensure(withinQuota(combined.filter(i => i.squadType === "main").length, combined.filter(i => i.squadType === "reserve").length, quotas[0].maxStarters, quotas[0].maxSubstitutes), "เกินโควตาตัวจริงหรือสำรอง", 409);
      await tx.privateDocument.update({ where: { id: documentId }, data: { retained: true } });
    }
    const roster = old ?? await tx.clubRoster.create({ data: { clubId, competitionId } });
    await tx.rosterItem.deleteMany({ where: { rosterId: roster.id } });
    await tx.rosterItem.createMany({ data: items.map(i => ({ ...i, rosterId: roster.id })) });
    const updated = await tx.clubRoster.update({ where: { id: roster.id }, data: {
      version: { increment: 1 }, documentId, status: submit ? "SUBMITTED" : old?.status ?? "DRAFT",
      ...(submit ? { submittedBy: session.id, submittedAt: new Date() } : {}),
      events: { create: { action: submit ? "SUBMITTED" : "SAVED", actorId: session.id, payload: json({ items, documentId, advisorApproved: submit }) } },
    } });
    if (submit) for (const item of items) await tx.application.update({ where: { id: item.applicationId }, data: {
      squadType: item.squadType, status: "CLUB_APPROVED",
      statusHistory: { create: { status: "CLUB_APPROVED", label: "ชมรมส่งบัญชีลงนาม", by: session.id } },
    } });
    return { roster: updated };
  });
}
export async function returnRoster(session: JWTPayload, data: Record<string, unknown>) {
  const id = string(data.id, "id"); const expected = version(data.version);
  const reason = string(data.reason, "เหตุผล", 2000);
  return atomic(async tx => {
    const roster = await tx.clubRoster.findUnique({ where: { id }, include: { items: { include: { application: true } } } });
    ensure(roster, "ไม่พบบัญชี", 404);
    ensure(roster.version === expected && roster.status === "SUBMITTED", "สถานะหรือ version เปลี่ยน กรุณาโหลดใหม่", 409);
    ensure(roster.items.every(i => i.application.status !== "FINAL_SELECTED"), "มีผู้ประกาศผลแล้ว ส่งคืนไม่ได้", 409);
    for (const item of roster.items) await tx.application.update({ where: { id: item.applicationId }, data: {
      status: "SUBMITTED", squadType: null,
      statusHistory: { create: { status: "SUBMITTED", label: "ส่งคืนบัญชี: " + reason, by: session.id } },
    } });
    return { roster: await tx.clubRoster.update({ where: { id }, data: {
      status: "RETURNED", version: { increment: 1 },
      events: { create: { action: "RETURNED", actorId: session.id, reason, payload: json({ items: roster.items.map(i => ({ applicationId: i.applicationId, squadType: i.squadType })), documentId: roster.documentId }) } },
    } }) };
  });
}
export async function clubRosterView(clubId: string, competitionId: string) {
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  ensure(club?.isActive, "ไม่พบชมรม", 403);
  const [roster, applications, competition] = await Promise.all([
    prisma.clubRoster.findUnique({ where: { clubId_competitionId: { clubId, competitionId } }, include: { items: true, events: { orderBy: { createdAt: "desc" } } } }),
    prisma.application.findMany({ where: { competitionId, sport: club.sport }, select: { id: true, status: true, squadType: true, user: { select: { studentId: true, profile: { select: { firstName: true, lastName: true } } } } } }),
    prisma.competition.findUnique({ where: { id: competitionId }, include: { quotas: { where: { sport: club.sport } } } }),
  ]);
  return { roster, applications, competition };
}

