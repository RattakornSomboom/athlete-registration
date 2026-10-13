import { prisma } from "@/lib/prisma";
import type { JWTPayload } from "@/lib/auth";
import { atomic, ensure, json, openCompetition, ownedDocument, string, version } from "@/lib/phase4-server";
import { withinQuota } from "@/lib/phase4-policy";
import { assertEvidenceAllPassed, hasVerifiedResults } from "@/lib/evidence-verification-service";
import { evaluateTeamReadiness, MIN_APPROVED_ACTIVITIES } from "@/lib/team-readiness";
import { getSportType } from "@/lib/sport-type";

function eventKey(entry: { category: string; division: string | null }) {
  return `${entry.category}::${entry.division ?? "ทั่วไป"}`;
}

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
    ensure(row.squadType === "main" || row.squadType === "reserve" || row.squadType === "selected", "ประเภทนักกีฬาไม่ถูกต้อง");
    return { applicationId: string(row.applicationId, "applicationId"), squadType: row.squadType as string };
  });
  ensure(new Set(items.map(i => i.applicationId)).size === items.length, "มีรายการซ้ำ");

  return atomic(async tx => {
    const club = await tx.club.findUnique({ where: { id: clubId } });
    ensure(club?.isActive, "ชมรมถูกปิด", 403);
    const [competition, configuredSport] = await Promise.all([
      openCompetition(tx, competitionId),
      tx.sportConfig.findFirst({ where: { name: club.sport }, select: { sportType: true } }),
    ]);
    const sportType = getSportType(club.sport, configuredSport?.sportType);
    const quotas = competition.quotas.filter(q => q.sport === club.sport);
    ensure(quotas.length === 1, "ต้องมีโควตากีฬาที่ไม่ซ้ำก่อนจัดบัญชี", 409);
    const quota = quotas[0];

    if (sportType === "TEAM") {
      ensure(items.every(i => i.squadType === "main" || i.squadType === "reserve"), "กีฬาแบบทีมต้องเลือกเป็นตัวจริงหรือตัวสำรอง", 400);
    } else {
      ensure(items.every(i => i.squadType === "selected"), "กีฬาแบบเดี่ยวต้องใช้สถานะผ่านการคัดเลือก", 400);
    }

    const old = await tx.clubRoster.findUnique({ where: { clubId_competitionId: { clubId, competitionId } }, include: { items: true } });
    ensure((old?.version ?? 0) === expected && old?.status !== "SUBMITTED", "บัญชีถูกล็อกหรือ version เปลี่ยน กรุณาโหลดใหม่", 409);
    const apps = await tx.application.findMany({
      where: { id: { in: items.map(i => i.applicationId) } },
      include: { rosterItem: true, sportEntries: true },
    });
    ensure(apps.length === items.length && apps.every(a => a.competitionId === competitionId && a.sport === club.sport && !a.noClubFileUrl && a.clubId === club.id && (!a.rosterItem || a.rosterItem.rosterId === old?.id)), "มีใบสมัครนอกขอบเขตชมรม", 403);
    ensure(apps.every(a => ["SUBMITTED", "CLUB_APPROVED"].includes(a.status)), "มีใบสมัครที่พิจารณาแล้วหรือถูกปฏิเสธ", 409);

    if (sportType === "INDIVIDUAL") {
      ensure(apps.every(a => Math.max(a.sportEntries.length, 1) <= Math.max(quota.maxStarters, 1)), "มีนักกีฬาสมัครประเภทย่อยเกินโควตาสูงสุดต่อคน", 409);
    }

    const documentId = typeof data.documentId === "string" && data.documentId ? data.documentId : null;
    if (documentId) await ownedDocument(tx, documentId, clubId, "ROSTER");
    if (submit) {
      ensure(items.length > 0 && data.advisorApproved === true && documentId, "ต้องเลือกรายชื่อ ยืนยัน และแนบเอกสารลงนาม");
      await assertEvidenceAllPassed(tx, items.map(i => i.applicationId));
      ensure(club.status === "ACTIVE", "ชมรมยังไม่ได้รับสถานะ ACTIVE จึงส่งบัญชีรายชื่อไม่ได้", 409);

      if (sportType === "TEAM") {
        const rosterApps = await tx.application.findMany({
          where: { id: { in: items.map(i => i.applicationId) } },
          select: {
            competitionResults: { select: { id: true, year: true } },
            competition: { select: { year: true } },
            statusHistory: { where: { status: { startsWith: "EVIDENCE:" } }, select: { id: true, status: true, label: true, by: true, createdAt: true } },
          },
        });
        const readiness = evaluateTeamReadiness(rosterApps.length, rosterApps.filter(hasVerifiedResults).length, true);
        ensure(readiness.passed, readiness.message, 409);
        const approvedActivities = await tx.activity.count({ where: { clubId, status: "approved" } });
        ensure(approvedActivities >= MIN_APPROVED_ACTIVITIES, `ชมรมต้องมีกิจกรรมที่ได้รับอนุมัติอย่างน้อย ${MIN_APPROVED_ACTIVITIES} กิจกรรมก่อนส่งบัญชีรายชื่อ`, 409);

        const other = await tx.rosterItem.findMany({ where: { roster: { competitionId, status: "SUBMITTED", NOT: { clubId } }, application: { sport: club.sport } } });
        const combined = [...items, ...other];
        ensure(withinQuota(combined.filter(i => i.squadType === "main").length, combined.filter(i => i.squadType === "reserve").length, quota.maxStarters, quota.maxSubstitutes), "เกินโควตาตัวจริงหรือสำรอง", 409);
      } else {
        const other = await tx.rosterItem.findMany({
          where: { roster: { competitionId, status: "SUBMITTED", NOT: { clubId } }, application: { sport: club.sport }, squadType: "selected" },
          include: { application: { select: { category: true, division: true, sportEntries: true } } },
        });
        const selectedEntries = [
          ...apps.flatMap(a => a.sportEntries.length ? a.sportEntries : [{ category: a.category, division: a.division }]),
          ...other.flatMap(i => i.application.sportEntries.length ? i.application.sportEntries : [{ category: i.application.category, division: i.application.division }]),
        ];
        const eventLimit = quota.maxEntriesPerEvent ?? Math.max(quota.maxSubstitutes || quota.maxStarters, 1);
        const counts = new Map<string, number>();
        for (const entry of selectedEntries) counts.set(eventKey(entry), (counts.get(eventKey(entry)) ?? 0) + 1);
        ensure([...counts.values()].every(count => count <= eventLimit), "มีผู้ผ่านการคัดเลือกเกินโควตารวมต่อประเภท/รุ่นแข่งขันย่อย", 409);
      }
      await tx.privateDocument.update({ where: { id: documentId }, data: { retained: true } });
    }

    const roster = old ?? await tx.clubRoster.create({ data: { clubId, competitionId } });
    await tx.rosterItem.deleteMany({ where: { rosterId: roster.id } });
    await tx.rosterItem.createMany({ data: items.map(i => ({ ...i, rosterId: roster.id })) });
    const updated = await tx.clubRoster.update({ where: { id: roster.id }, data: {
      version: { increment: 1 }, documentId, status: submit ? "SUBMITTED" : old?.status ?? "DRAFT",
      ...(submit ? { submittedBy: session.id, submittedAt: new Date() } : {}),
      events: { create: { action: submit ? "SUBMITTED" : "SAVED", actorId: session.id, payload: json({ items, documentId, advisorApproved: submit, sportType }) } },
    } });
    if (submit) for (const item of items) await tx.application.update({ where: { id: item.applicationId }, data: {
      squadType: item.squadType, status: "CLUB_APPROVED",
      statusHistory: { create: { status: "CLUB_APPROVED", label: sportType === "TEAM" ? "ชมรมส่งบัญชีลงนาม" : "ชมรมยืนยันรายชื่อผู้ผ่านการคัดเลือก", by: session.id } },
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
  const [roster, applications, competition, configuredSport] = await Promise.all([
    prisma.clubRoster.findUnique({ where: { clubId_competitionId: { clubId, competitionId } }, include: { items: true, events: { orderBy: { createdAt: "desc" } } } }),
    prisma.application.findMany({
      where: {
        competitionId,
        sport: club.sport,
        OR: [{ noClubFileUrl: null }, { noClubFileUrl: "" }],
        clubId: club.id,
      },
      select: { id: true, status: true, squadType: true, category: true, division: true, sportEntries: true, user: { select: { studentId: true, profile: { select: { firstName: true, lastName: true, gpaCumulative: true, faculty: true, major: true } } } }, competitionResults: true },
    }),
    prisma.competition.findUnique({ where: { id: competitionId }, include: { quotas: { where: { sport: club.sport } } } }),
    prisma.sportConfig.findFirst({ where: { name: club.sport }, select: { sportType: true } }),
  ]);
  return {
    roster,
    applications,
    competition,
    sportType: getSportType(club.sport, configuredSport?.sportType),
    club: { id: club.id, name: club.name, sport: club.sport, presidentName: club.presidentName },
  };
}