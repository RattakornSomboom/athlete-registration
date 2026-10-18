import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ApiError, atomic, ensure, json, type Tx } from "@/lib/phase4-server";
import {
  ATHLETICS_TRACK_EVENTS,
  EXCELLENCE_SPORT,
  TRACK_CATEGORIES,
  benchmarkKey,
  buildAthleteDetail,
  extractStationRatings,
  filterRows,
  overviewRows,
  parseBenchmarks,
  parseTrackGender,
  readExcellenceStorage,
  summarizeRows,
  writeExcellenceStorage,
  type AthleteDetail,
  type AthleteRecord,
  type DevelopmentPlan,
  type OverviewFilter,
  type OverviewRow,
  type OverviewSummary,
  type TrackBenchmarks,
  type TrackResult,
} from "@/lib/excellence-athletics";
import { DEMO_BENCHMARKS, getDemoAthletes } from "@/lib/excellence-demo";
import {
  assertEventForGender,
  ExcellenceValidationError,
  type BenchmarkInput,
  type PlanInput,
  type ResultFields,
  type ResultInput,
  type RetestInput,
} from "@/lib/excellence-validation";

export const BENCHMARK_SETTING_KEY = "ATHLETICS_TRACK_BENCHMARKS";
const ELIGIBLE_STATUSES = ["STAFF_APPROVED", "FINAL_SELECTED"] as const;
const TRACK_CATEGORY_NAMES = Object.keys(TRACK_CATEGORIES);

const applicationInclude = {
  user: { select: { studentId: true, profile: { select: { firstName: true, lastName: true, faculty: true } } } },
  competition: { select: { name: true } },
  fitnessTestResult: { select: { scores: true, testedAt: true } },
  matchEntries: {
    where: { timeSeconds: { not: null }, match: { sport: EXCELLENCE_SPORT, eventType: "TIMED" as const } },
    include: { match: { select: { division: true, stage: true, scheduledAt: true, createdAt: true, competition: { select: { name: true } } } } },
  },
};

type ApplicationRow = Awaited<ReturnType<typeof loadApplications>>[number];

function loadApplications(db: Tx | typeof prisma, applicationId?: string) {
  return db.application.findMany({
    where: {
      ...(applicationId ? { id: applicationId } : {}),
      sport: EXCELLENCE_SPORT,
      category: { in: TRACK_CATEGORY_NAMES },
      status: { in: [...ELIGIBLE_STATUSES] },
    },
    include: applicationInclude,
    orderBy: { createdAt: "asc" },
  });
}

const KNOWN_EVENTS = new Set(ATHLETICS_TRACK_EVENTS.map(event => event.key));

function toRecord(app: ApplicationRow): AthleteRecord | null {
  const gender = parseTrackGender(app.category);
  if (!gender) return null;
  const profile = app.user.profile;
  const results: TrackResult[] = app.matchEntries.flatMap(entry => {
    const event = entry.match.division ?? "";
    if (!KNOWN_EVENTS.has(event) || entry.timeSeconds === null) return [];
    return [{
      id: entry.id,
      event,
      timeSeconds: entry.timeSeconds,
      competedAt: (entry.match.scheduledAt ?? entry.match.createdAt).toISOString().slice(0, 10),
      competitionName: entry.match.competition.name,
      stage: entry.match.stage,
    }];
  });
  return {
    applicationId: app.id,
    studentId: app.user.studentId ?? "",
    name: profile ? `${profile.firstName} ${profile.lastName}` : "ไม่ระบุชื่อ",
    faculty: profile?.faculty ?? "",
    gender,
    competitionName: app.competition.name,
    fitness: app.fitnessTestResult
      ? { testedAt: app.fitnessTestResult.testedAt?.toISOString().slice(0, 10) ?? null, ratings: extractStationRatings(app.fitnessTestResult.scores) }
      : null,
    results,
    storage: readExcellenceStorage(app.fitnessTestResult?.scores),
  };
}

async function loadBenchmarks(db: Tx | typeof prisma): Promise<TrackBenchmarks> {
  const setting = await db.systemSetting.findUnique({ where: { key: BENCHMARK_SETTING_KEY } });
  return parseBenchmarks(setting?.value);
}

export type OverviewResponse = {
  isDemo: boolean;
  rows: OverviewRow[];
  summary: OverviewSummary;
  benchmarks: TrackBenchmarks;
};

export async function getOverview(filter: OverviewFilter, demo: boolean): Promise<OverviewResponse> {
  const [records, benchmarks] = demo
    ? [getDemoAthletes(), DEMO_BENCHMARKS]
    : await Promise.all([
        loadApplications(prisma).then(apps => apps.map(toRecord).filter((record): record is AthleteRecord => record !== null)),
        loadBenchmarks(prisma),
      ]);
  const rows = filterRows(records.flatMap(record => overviewRows(record, benchmarks)), filter);
  return { isDemo: demo, rows, summary: summarizeRows(rows), benchmarks };
}

export async function getAthleteDetail(applicationId: string, demo: boolean): Promise<AthleteDetail & { isDemo: boolean }> {
  if (demo) {
    const record = getDemoAthletes().find(candidate => candidate.applicationId === applicationId);
    ensure(record, "ไม่พบนักกีฬาในชุดข้อมูลสาธิต", 404);
    return { ...buildAthleteDetail(record, DEMO_BENCHMARKS), isDemo: true };
  }
  const [apps, benchmarks] = await Promise.all([loadApplications(prisma, applicationId), loadBenchmarks(prisma)]);
  const record = apps[0] ? toRecord(apps[0]) : null;
  ensure(record, "ไม่พบนักกีฬากรีฑาประเภทลู่ที่ผ่านการคัดเลือก", 404);
  return { ...buildAthleteDetail(record, benchmarks), isDemo: false };
}

export async function getBenchmarks(demo: boolean): Promise<{ isDemo: boolean; benchmarks: TrackBenchmarks }> {
  return { isDemo: demo, benchmarks: demo ? DEMO_BENCHMARKS : await loadBenchmarks(prisma) };
}

async function eligibleRecord(tx: Tx, applicationId: string): Promise<{ app: ApplicationRow; record: AthleteRecord }> {
  const apps = await loadApplications(tx, applicationId);
  const app = apps[0];
  const record = app ? toRecord(app) : null;
  ensure(app && record, "บันทึกได้เฉพาะนักกีฬากรีฑาประเภทลู่ที่ผ่านการคัดเลือกแล้ว", 404);
  return { app, record };
}

type MatchTarget = { competitionId: string; category: string };

// ผลแข่งรายการ/วัน/รอบเดียวกันของการแข่งขันเดียวกันใช้ match เดียวกัน ไม่สร้าง match ใหม่ทุกครั้ง
async function findOrCreateMatch(tx: Tx, target: MatchTarget, fields: ResultFields) {
  const scheduledAt = new Date(`${fields.competedAt}T00:00:00.000Z`);
  const existing = await tx.competitionMatch.findFirst({
    where: {
      competitionId: target.competitionId,
      sport: EXCELLENCE_SPORT,
      category: target.category,
      division: fields.event,
      eventType: "TIMED",
      scheduledAt,
      stage: fields.stage,
    },
  });
  if (existing) return existing;
  return tx.competitionMatch.create({
    data: {
      competitionId: target.competitionId,
      sport: EXCELLENCE_SPORT,
      category: target.category,
      division: fields.event,
      eventType: "TIMED",
      stage: fields.stage,
      scheduledAt,
      status: "COMPLETED",
    },
  });
}

// ผลเดียวกัน (นักกีฬา+รายการ+วัน+เวลา) บันทึกซ้ำไม่ได้ เช่น กดส่งซ้ำหรือคีย์ซ้ำ
async function assertNotDuplicate(tx: Tx, applicationId: string, fields: ResultFields, exceptEntryId?: string) {
  const duplicate = await tx.competitionMatchEntry.findFirst({
    where: {
      applicationId,
      timeSeconds: fields.timeSeconds,
      ...(exceptEntryId ? { id: { not: exceptEntryId } } : {}),
      match: { sport: EXCELLENCE_SPORT, eventType: "TIMED", division: fields.event, scheduledAt: new Date(`${fields.competedAt}T00:00:00.000Z`) },
    },
    select: { id: true },
  });
  if (duplicate) throw new ApiError(409, "มีผลเวลานี้ของรายการและวันที่เดียวกันบันทึกไว้แล้ว");
}

async function removeEmptyMatch(tx: Tx, matchId: string) {
  const remaining = await tx.competitionMatchEntry.count({ where: { matchId } });
  if (remaining === 0) await tx.competitionMatch.delete({ where: { id: matchId } });
}

export async function recordResult(input: ResultInput) {
  return atomic(async tx => {
    const { app, record } = await eligibleRecord(tx, input.applicationId);
    assertEventForGender(input.event, record.gender);
    await assertNotDuplicate(tx, app.id, input);
    const match = await findOrCreateMatch(tx, app, input);
    const entry = await tx.competitionMatchEntry.create({
      data: { matchId: match.id, applicationId: app.id, participantName: record.name, timeSeconds: input.timeSeconds },
    });
    return { success: true, resultId: entry.id };
  });
}

// โหลดผลเวลาของโมดูลนี้เท่านั้น (กรีฑาลู่, TIMED) และตรวจว่านักกีฬายังผ่านการคัดเลือก
async function editableEntry(tx: Tx, resultId: string) {
  const entry = await tx.competitionMatchEntry.findUnique({ where: { id: resultId }, include: { match: true } });
  ensure(
    entry && entry.applicationId && entry.timeSeconds !== null
      && entry.match.sport === EXCELLENCE_SPORT && entry.match.eventType === "TIMED" && KNOWN_EVENTS.has(entry.match.division ?? ""),
    "ไม่พบผลเวลาที่ต้องการ",
    404,
  );
  const { app, record } = await eligibleRecord(tx, entry.applicationId as string);
  return { entry, app, record };
}

export async function updateResult(resultId: string, fields: ResultFields) {
  return atomic(async tx => {
    const { entry, app, record } = await editableEntry(tx, resultId);
    assertEventForGender(fields.event, record.gender);
    await assertNotDuplicate(tx, app.id, fields, entry.id);
    const match = await findOrCreateMatch(tx, app, fields);
    await tx.competitionMatchEntry.update({ where: { id: entry.id }, data: { matchId: match.id, timeSeconds: fields.timeSeconds } });
    if (match.id !== entry.matchId) await removeEmptyMatch(tx, entry.matchId);
    return { success: true };
  });
}

export async function deleteResult(resultId: string) {
  return atomic(async tx => {
    const { entry } = await editableEntry(tx, resultId);
    await tx.competitionMatchEntry.delete({ where: { id: entry.id } });
    await removeEmptyMatch(tx, entry.matchId);
    return { success: true };
  });
}

export async function saveBenchmark(input: BenchmarkInput, actorId: string) {
  return atomic(async tx => {
    const benchmarks = await loadBenchmarks(tx);
    const key = benchmarkKey(input.event, input.gender);
    if (input.targetSeconds === null) delete benchmarks[key];
    else benchmarks[key] = { targetSeconds: input.targetSeconds, updatedAt: new Date().toISOString(), updatedBy: actorId };
    await tx.systemSetting.upsert({
      where: { key: BENCHMARK_SETTING_KEY },
      update: { value: json(benchmarks) },
      create: { key: BENCHMARK_SETTING_KEY, value: json(benchmarks) },
    });
    return { success: true, benchmarks };
  });
}

// แผนและผลทดสอบซ้ำเก็บใน FitnessTestResult.scores._excellence.v2 และใช้ revision เป็น optimistic lock
async function updateStorage(
  tx: Tx,
  applicationId: string,
  expectedRevision: number,
  change: (storage: ReturnType<typeof readExcellenceStorage>, record: AthleteRecord) => void,
) {
  const { record } = await eligibleRecord(tx, applicationId);
  const fitness = await tx.fitnessTestResult.findUnique({ where: { applicationId }, select: { id: true, scores: true } });
  ensure(fitness, "ยังไม่มีผลทดสอบสมรรถภาพของนักกีฬาคนนี้ จึงยังบันทึกแผนหรือผลทดสอบซ้ำไม่ได้", 409);
  const storage = readExcellenceStorage(fitness.scores);
  if (storage.revision !== expectedRevision) throw new ApiError(409, "ข้อมูลถูกแก้ไขโดยผู้อื่นแล้ว กรุณาโหลดหน้าใหม่");
  change(storage, record);
  const next = { ...storage, revision: storage.revision + 1 };
  await tx.fitnessTestResult.update({ where: { id: fitness.id }, data: { scores: json(writeExcellenceStorage(fitness.scores, next)) } });
  return { success: true, revision: next.revision };
}

export async function savePlan(input: PlanInput, actorId: string) {
  return atomic(tx => updateStorage(tx, input.applicationId, input.revision, storage => {
    const existing = input.plan.id ? storage.plans.find(plan => plan.id === input.plan.id) : undefined;
    ensure(!input.plan.id || existing, "ไม่พบแผนพัฒนาที่ต้องการแก้ไข", 404);
    const plan: DevelopmentPlan = {
      id: existing?.id ?? randomUUID(),
      coachName: input.plan.coachName,
      startDate: input.plan.startDate,
      endDate: input.plan.endDate,
      status: input.plan.status,
      items: input.plan.items.map(item => ({
        id: item.id && existing?.items.some(current => current.id === item.id) ? item.id : randomUUID(),
        stationKey: item.stationKey,
        activity: item.activity,
      })),
      notes: input.plan.notes,
      updatedAt: new Date().toISOString(),
      updatedBy: actorId,
    };
    storage.plans = existing ? storage.plans.map(current => current.id === plan.id ? plan : current) : [...storage.plans, plan];
  }));
}

export async function updateRetest(retestId: string, input: RetestInput, actorId: string) {
  return atomic(tx => updateStorage(tx, input.applicationId, input.revision, (storage, record) => {
    const existing = storage.retests.find(retest => retest.id === retestId);
    ensure(existing, "ไม่พบผลทดสอบซ้ำที่ต้องการแก้ไข", 404);
    ensure(!input.retest.planId || storage.plans.some(plan => plan.id === input.retest.planId), "ไม่พบแผนพัฒนาที่อ้างถึง", 404);
    if (input.retest.event) assertEventForGender(input.retest.event, record.gender);
    storage.retests = storage.retests.map(retest => retest.id === retestId
      ? {
          ...retest,
          planId: input.retest.planId,
          testedAt: input.retest.testedAt,
          ratings: input.retest.ratings,
          event: input.retest.event,
          timeSeconds: input.retest.timeSeconds,
          notes: input.retest.notes,
          updatedAt: new Date().toISOString(),
          updatedBy: actorId,
        }
      : retest);
  }));
}

export async function deleteRetest(retestId: string, input: { applicationId: string; revision: number }) {
  return atomic(tx => updateStorage(tx, input.applicationId, input.revision, storage => {
    ensure(storage.retests.some(retest => retest.id === retestId), "ไม่พบผลทดสอบซ้ำที่ต้องการลบ", 404);
    storage.retests = storage.retests.filter(retest => retest.id !== retestId);
  }));
}

export async function saveRetest(input: RetestInput, actorId: string) {
  return atomic(tx => updateStorage(tx, input.applicationId, input.revision, (storage, record) => {
    ensure(!input.retest.planId || storage.plans.some(plan => plan.id === input.retest.planId), "ไม่พบแผนพัฒนาที่อ้างถึง", 404);
    if (input.retest.event) assertEventForGender(input.retest.event, record.gender);
    storage.retests = [...storage.retests, {
      id: randomUUID(),
      planId: input.retest.planId,
      testedAt: input.retest.testedAt,
      ratings: input.retest.ratings,
      event: input.retest.event,
      timeSeconds: input.retest.timeSeconds,
      notes: input.retest.notes,
      recordedAt: new Date().toISOString(),
      recordedBy: actorId,
    }];
  }));
}

// แปลง error ของ validator เป็น ApiError เพื่อให้ api() ตอบเป็น JSON ภาษาไทยพร้อม fieldErrors
export async function withValidation<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ExcellenceValidationError) throw new ApiError(error.status, error.message, error.fieldErrors);
    throw error;
  }
}

export function overviewFilter(params: URLSearchParams): OverviewFilter {
  const event = params.get("event") ?? "";
  const gender = params.get("gender");
  return {
    event: KNOWN_EVENTS.has(event) ? event : undefined,
    gender: gender === "ชาย" || gender === "หญิง" ? gender : undefined,
    search: params.get("search")?.slice(0, 100) || undefined,
  };
}

export function isDemoRequest(params: URLSearchParams): boolean {
  return params.get("demo") === "true";
}
