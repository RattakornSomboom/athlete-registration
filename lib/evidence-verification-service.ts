import type { JWTPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensure, string, type Tx } from "@/lib/phase4-server";
import { evaluateGpax, isFirstSemesterGradeExempt } from "@/lib/rule-checker";
import {
  EVIDENCE_ITEMS,
  EVIDENCE_ITEM_LABELS,
  EVIDENCE_RESULTS,
  EVIDENCE_RESULT_LABELS,
  REQUIRED_EVIDENCE_ITEMS,
  buildEvidenceLabel,
  encodeEvidenceStatus,
  evaluateResultRecency,
  isEvidenceHistory,
  summarizeEvidence,
  type EvidenceItem,
  type EvidenceResult,
} from "@/lib/evidence-verification";

type AutoCheck = { passed: boolean | null; message: string };

async function loadApplication(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      competition: { select: { year: true } },
      user: { select: { profile: true } },
      competitionResults: { select: { year: true } },
      fitnessTestResult: { select: { status: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  ensure(application, "ไม่พบใบสมัคร", 404);
  return application;
}

type LoadedApplication = Awaited<ReturnType<typeof loadApplication>>;

function autoChecks(application: LoadedApplication): Record<EvidenceItem, AutoCheck> {
  const profile = application.user.profile;
  const gpax = profile && isFirstSemesterGradeExempt(profile)
    ? { passed: true, message: "ยกเว้นเกณฑ์ GPAX: นิสิตปี 1 เทอม 1 ยังไม่มีผลการเรียนสะสม" }
    : evaluateGpax(profile?.gpaCumulative);
  const recency = evaluateResultRecency(application.competitionResults, application.competition.year);
  const fitness = application.fitnessTestResult?.status;
  return {
    STUDENT_STATUS: { passed: null, message: "ตรวจจากบัตรนิสิตและหนังสือรับรองสถานภาพนิสิตที่แนบ" },
    GPAX: { passed: gpax.passed, message: gpax.message ?? "" },
    COMPETITION_HISTORY: { passed: recency.passed, message: recency.message },
    FITNESS_TEST: {
      passed: fitness === "PASSED" ? true : fitness === "FAILED" ? false : null,
      message: fitness === "PASSED" ? "ผลทดสอบสมรรถภาพ: ผ่านเกณฑ์"
        : fitness === "FAILED" ? "ผลทดสอบสมรรถภาพ: ไม่ผ่านเกณฑ์"
        : "ยังไม่มีผลทดสอบสมรรถภาพที่ผ่านเกณฑ์",
    },
  };
}

async function buildReview(application: LoadedApplication) {
  const evidenceHistory = application.statusHistory.filter((row) => isEvidenceHistory(row.status));
  const summary = summarizeEvidence(evidenceHistory);
  const reviewerIds = [...new Set(evidenceHistory.map((row) => row.by))];
  const reviewers = reviewerIds.length
    ? await prisma.user.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, studentId: true, email: true } })
    : [];
  const reviewerName = (id: string | null) => {
    if (!id) return null;
    const user = reviewers.find((candidate) => candidate.id === id);
    return user ? user.studentId ?? user.email : id;
  };
  const auto = autoChecks(application);
  return {
    applicationId: application.id,
    items: EVIDENCE_ITEMS.map((item) => ({
      item,
      itemLabel: EVIDENCE_ITEM_LABELS[item],
      result: summary[item].result,
      resultLabel: EVIDENCE_RESULT_LABELS[summary[item].result],
      note: summary[item].label,
      checkedBy: reviewerName(summary[item].by),
      checkedAt: summary[item].createdAt,
      auto: auto[item],
    })),
  };
}

async function assertEvidenceAccess(session: JWTPayload, applicationId: string) {
  if (session.role !== "CLUB") return;
  ensure(session.clubId, "ไม่พบชมรม", 403);
  const [club, application] = await Promise.all([
    prisma.club.findUnique({ where: { id: session.clubId }, select: { isActive: true, sport: true } }),
    prisma.application.findUnique({ where: { id: applicationId }, select: { sport: true } }),
  ]);
  ensure(club?.isActive && application && club.sport === application.sport, "ไม่มีสิทธิ์ตรวจหลักฐานของใบสมัครนี้", 403);
}

export async function getEvidenceReview(session: JWTPayload, applicationId: string) {
  await assertEvidenceAccess(session, applicationId);
  return buildReview(await loadApplication(applicationId));
}

export { hasVerifiedResults } from "@/lib/evidence-verification";

/** Blocks approval unless every evidence item has a latest result of PASSED. */
export async function assertEvidenceAllPassed(tx: Tx, applicationIds: string[]) {
  if (applicationIds.length === 0) return;
  const rows = await tx.statusHistory.findMany({
    where: { applicationId: { in: applicationIds }, status: { startsWith: "EVIDENCE:" } },
    orderBy: { createdAt: "asc" },
    select: { id: true, applicationId: true, status: true, label: true, by: true, createdAt: true },
  });
  const apps = await tx.application.findMany({
    where: { id: { in: applicationIds } },
    select: {
      id: true,
      user: { select: { studentId: true } },
      competitionResults: { select: { year: true } },
      competition: { select: { year: true } },
    },
  });
  for (const app of apps) {
    const summary = summarizeEvidence(rows.filter((row) => row.applicationId === app.id));
    const missing = REQUIRED_EVIDENCE_ITEMS.filter((item) => {
      if (summary[item].result === "PASSED") return false;
      // หากผู้สมัครมีผลงานการแข่งขันที่อยู่ในเกณฑ์ 2 ปี ระบบอนุโลมให้ผ่านอัตโนมัติหากยังไม่ถูกปฏิเสธ
      if (item === "COMPETITION_HISTORY" && summary[item].result === "PENDING") {
        const recency = evaluateResultRecency(app.competitionResults, app.competition.year);
        if (recency.passed === true) return false;
      }
      return true;
    });
    ensure(
      missing.length === 0,
      `ใบสมัคร ${app.user.studentId ?? app.id} ยังตรวจหลักฐานไม่ผ่านครบ: ${missing.map((item) => `${EVIDENCE_ITEM_LABELS[item]} (${EVIDENCE_RESULT_LABELS[summary[item].result]})`).join(", ")}`,
      409,
    );
  }
}

export async function recordEvidenceCheck(session: JWTPayload, applicationId: string, input: Record<string, unknown>) {
  const item = EVIDENCE_ITEMS.find((value) => value === input.item);
  const result: EvidenceResult | undefined = EVIDENCE_RESULTS.find((value) => value === input.result);
  ensure(item, "รายการตรวจหลักฐานไม่ถูกต้อง");
  await assertEvidenceAccess(session, applicationId);
  ensure(result, "ผลการตรวจไม่ถูกต้อง");

  const reasonText = typeof input.reason === "string" ? input.reason.trim() : "";
  const referenceText = typeof input.reference === "string" ? input.reference.trim() : "";
  const needsReason = result === "REJECTED" || result === "ACTION_REQUIRED";
  const reason = needsReason ? string(reasonText, "เหตุผล", 500) : reasonText ? string(reasonText, "หมายเหตุ", 500) : "";
  const reference = referenceText ? string(referenceText, "หลักฐานอ้างอิง", 300) : "";

  const application = await loadApplication(applicationId);
  if (result === "PASSED") {
    const auto = autoChecks(application)[item];
    ensure(auto.passed !== false, `ไม่สามารถบันทึกว่าผ่านได้: ${auto.message}`, 409);
    ensure(item !== "FITNESS_TEST" || auto.passed === true, `ไม่สามารถบันทึกว่าผ่านได้: ${auto.message}`, 409);
  }

  await prisma.statusHistory.create({
    data: {
      applicationId,
      status: encodeEvidenceStatus(item, result),
      label: buildEvidenceLabel(item, result, reason, reference),
      by: session.id,
    },
  });

  return { ...(await getEvidenceReview(session, applicationId)), message: "บันทึกผลการตรวจหลักฐานเรียบร้อย" };
}
