import type { Tx } from "@/lib/phase4-server";
import {
  EVIDENCE_ITEM_LABELS,
  EVIDENCE_RESULT_LABELS,
  REQUIRED_EVIDENCE_ITEMS,
  summarizeEvidence,
  evaluateResultRecency,
} from "@/lib/evidence-verification";
import { evaluateTeamReadiness, isTeamSport as isTeamByStarters } from "@/lib/team-readiness";
import { isTeamSport } from "@/lib/sport-type";
import { hasVerifiedResults } from "@/lib/evidence-verification-service";

export type PublicationProblem = {
  applicationId: string;
  studentId: string | null;
  name: string;
  sport: string;
  reasons: string[];
  kinds: PublicationProblemKind[];
};
export type PublicationProblemKind = "EVIDENCE" | "ROSTER" | "TEAM";

const EVIDENCE_SELECT = { id: true, applicationId: true, status: true, label: true, by: true, createdAt: true } as const;

/** Returns every blocking issue for the given STAFF_APPROVED applications; an empty list means they may be published. */
export async function collectPublicationProblems(tx: Tx, competitionId: string, applicationIds: string[]): Promise<PublicationProblem[]> {
  if (applicationIds.length === 0) return [];
  const [applications, competition] = await Promise.all([
    tx.application.findMany({
      where: { id: { in: applicationIds }, competitionId },
      select: {
        id: true,
        sport: true,
        noClubFileUrl: true,
        user: { select: { studentId: true, profile: { select: { firstName: true, lastName: true } } } },
        rosterItem: { select: { rosterId: true, roster: { select: { status: true } } } },
        competitionResults: { select: { year: true } },
        competition: { select: { year: true } },
      },
    }),
    tx.competition.findUnique({ where: { id: competitionId }, select: { year: true, quotas: { select: { sport: true, maxStarters: true } } } }),
  ]);
  const evidence = await tx.statusHistory.findMany({
    where: { applicationId: { in: applicationIds }, status: { startsWith: "EVIDENCE:" } },
    orderBy: { createdAt: "asc" },
    select: EVIDENCE_SELECT,
  });

  const problems = new Map<string, { kind: PublicationProblemKind; reason: string }[]>();
  const add = (id: string, kind: PublicationProblemKind, reason: string) => problems.set(id, [...(problems.get(id) ?? []), { kind, reason }]);

  for (const application of applications) {
    const summary = summarizeEvidence(evidence.filter((row) => row.applicationId === application.id));
    for (const item of REQUIRED_EVIDENCE_ITEMS) {
      if (summary[item].result !== "PASSED") {
        if (item === "COMPETITION_HISTORY" && summary[item].result === "PENDING" && application.competitionResults && application.competition) {
          const recency = evaluateResultRecency(application.competitionResults as { year: string }[], application.competition.year);
          if (recency.passed === true) continue;
        }
        add(application.id, "EVIDENCE", `${EVIDENCE_ITEM_LABELS[item]}: ${EVIDENCE_RESULT_LABELS[summary[item].result]}`);
      }
    }
    if (!application.noClubFileUrl && application.rosterItem?.roster.status !== "SUBMITTED") add(application.id, "ROSTER", "บัญชีรายชื่อของชมรมยังไม่ได้ส่ง");
  }

  const rosterIds = [...new Set(applications.flatMap((a) => (a.rosterItem?.roster.status === "SUBMITTED" ? [a.rosterItem.rosterId] : [])))];
  for (const rosterId of rosterIds) {
    const members = await tx.rosterItem.findMany({
      where: { rosterId },
      select: {
        applicationId: true,
        application: {
          select: {
            sport: true,
            competitionResults: { select: { id: true, year: true } },
            statusHistory: { where: { status: { startsWith: "EVIDENCE:" } }, select: { id: true, status: true, label: true, by: true, createdAt: true } },
          },
        },
      },
    });
    const sport = members[0]?.application.sport;
    const quota = competition?.quotas.find((q) => q.sport === sport);
    if (!isTeamSport(sport) && !isTeamByStarters(quota?.maxStarters)) continue;
    const readiness = evaluateTeamReadiness(members.length, members.filter((m) => hasVerifiedResults({ ...m.application, competition: competition ? { year: competition.year } : undefined })).length, true);
    if (readiness.passed) continue;
    for (const application of applications.filter((a) => a.rosterItem?.rosterId === rosterId)) add(application.id, "TEAM", `ทีมยังไม่ผ่านเกณฑ์ 50%: ${readiness.message}`);
  }

  return applications
    .filter((a) => problems.has(a.id))
    .map((a) => ({
      applicationId: a.id,
      studentId: a.user.studentId,
      name: `${a.user.profile?.firstName ?? ""} ${a.user.profile?.lastName ?? ""}`.trim(),
      sport: a.sport,
      reasons: (problems.get(a.id) ?? []).map((p) => p.reason),
      kinds: [...new Set((problems.get(a.id) ?? []).map((p) => p.kind))],
    }));
}
