// การวิเคราะห์ระดับโปรแกรม (cohort) ของโมดูล Excellence
// ฟังก์ชันทั้งหมดเป็น pure และไม่ import ค่า runtime จากโมดูลอื่น เพื่อให้ unit test รันด้วย node ได้โดยตรง
// แยกคำนวณทีละกีฬา เพราะเวลา 40 เมตร (วิ่ง) กับ 50 เมตร (ว่ายน้ำ) เฉลี่ยรวมกันไม่ได้

import type { MetricChange } from "./performance-analytics";

export const MIN_CORRELATION_SAMPLE = 8;

export type ProgramAthleteInput = {
  applicationId: string;
  sport: string;
  fitnessAverage: number | null;
  timeSeconds: number | null;
  stations: { name: string; score: number }[];
  hasActionPlan: boolean;
  followUp: { fitnessAverage: number | null; timeSeconds: number | null } | null;
};

export type ProgramBenchmark = { targetTimeSeconds: number; targetScore: number };

// ตัดสินว่าผลก่อน-หลังของแต่ละคน "เปลี่ยนจริง" หรือไม่ (delta = หลัง - ก่อน)
// ระบบจริงส่งเกณฑ์ SWC เดียวกับการ์ดรายคนเข้ามา เพื่อให้ตัวนับระดับโปรแกรมตรงกับการ์ด
export type ProgramChangeClassifier = {
  time: (beforeSeconds: number, deltaSeconds: number) => MetricChange;
  fitness: (delta: number) => MetricChange;
};

const signChange = (delta: number): MetricChange => delta === 0 ? "WITHIN_SWC" : delta > 0 ? "IMPROVED" : "DECLINED";

// ค่าเริ่มต้น: นับทุกการเปลี่ยนแปลงตามเครื่องหมาย (ไม่มีช่วงคลาดเคลื่อน)
export const RAW_CHANGE_CLASSIFIER: ProgramChangeClassifier = {
  time: (beforeSeconds, deltaSeconds) => signChange(-deltaSeconds),
  fitness: delta => signChange(delta),
};

export type Ratio = { count: number; total: number; pct: number | null };

export type CoverageCounts = {
  total: number;
  withFitness: number;
  withTime: number;
  withActionPlan: number;
  withFollowUp: number;
};

export type AttainmentSet = { time: Ratio; fitness: Ratio; both: Ratio };

export type TimePrePost = {
  n: number;
  medianGapBefore: number | null;
  medianGapAfter: number | null;
  medianDelta: number | null;
  improved: number;
  unchanged: number;
  worsened: number;
  gapClosed: { closed: number; hadGap: number };
  points: { applicationId: string; gapBefore: number; gapAfter: number; change: MetricChange }[];
};

export type FitnessPrePost = {
  n: number;
  medianBefore: number | null;
  medianAfter: number | null;
  medianDelta: number | null;
  improved: number;
  unchanged: number;
  worsened: number;
};

export type CorrelationStatus = "OK" | "INSUFFICIENT_N" | "NO_VARIATION" | "RACE_PROXY";
export type CorrelationStrength = "อ่อน" | "ปานกลาง" | "ชัด";

export type StationCorrelation = {
  station: string;
  n: number;
  // Spearman ρ ของคะแนนสถานี กับเวลาแข่ง (ค่าลบ = คะแนนสูงไปทางเวลาเร็วขึ้น)
  rho: number | null;
  // กลับเครื่องหมายให้อ่านง่าย: ค่าบวก = คะแนนสถานีสูง ↔ เวลาเร็วขึ้น
  alignment: number | null;
  strength: CorrelationStrength | null;
  status: CorrelationStatus;
};

export type SportProgramAnalytics = {
  sport: string;
  benchmark: ProgramBenchmark;
  coverage: CoverageCounts;
  baseline: AttainmentSet;
  followUp: {
    n: number;
    before: AttainmentSet;
    after: AttainmentSet;
    time: TimePrePost;
    fitness: FitnessPrePost;
  };
  correlations: StationCorrelation[];
};

export type ProgramAnalytics = {
  minCorrelationSample: number;
  sports: SportProgramAnalytics[];
};

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function ratio(count: number, total: number): Ratio {
  return { count, total, pct: total > 0 ? Math.round((count / total) * 100) : null };
}

export function median(values: number[], digits = 2): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return round(value, digits);
}

// อันดับแบบเฉลี่ยเมื่อคะแนนซ้ำ (ระดับสมรรถภาพมีแค่ 6 ขั้น จึงซ้ำบ่อย)
export function averageRanks(values: number[]): number[] {
  const indexed = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const ranks = new Array<number>(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j + 1 < indexed.length && indexed[j + 1].value === indexed[i].value) j += 1;
    const rank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) ranks[indexed[k].index] = rank;
    i = j + 1;
  }
  return ranks;
}

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const meanX = xs.reduce((sum, v) => sum + v, 0) / n;
  const meanY = ys.reduce((sum, v) => sum + v, 0) / n;
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  if (varX === 0 || varY === 0) return null;
  return cov / Math.sqrt(varX * varY);
}

export function spearman(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length) return null;
  const result = pearson(averageRanks(xs), averageRanks(ys));
  return result === null ? null : round(result, 3);
}

export function correlationStrength(rho: number): CorrelationStrength {
  const abs = Math.abs(rho);
  return abs >= 0.5 ? "ชัด" : abs >= 0.3 ? "ปานกลาง" : "อ่อน";
}

export function normalizeProgramSport(sport: string): string {
  return sport === "ว่ายน้ำ" ? "กีฬาทางน้ำ" : sport;
}

function attainment(
  rows: { time: boolean | null; fitness: boolean | null }[],
): AttainmentSet {
  const timeRows = rows.filter(row => row.time !== null);
  const fitnessRows = rows.filter(row => row.fitness !== null);
  const bothRows = rows.filter(row => row.time !== null && row.fitness !== null);
  return {
    time: ratio(timeRows.filter(row => row.time).length, timeRows.length),
    fitness: ratio(fitnessRows.filter(row => row.fitness).length, fitnessRows.length),
    both: ratio(bothRows.filter(row => row.time && row.fitness).length, bothRows.length),
  };
}

function onTarget(time: number | null, fitness: number | null, benchmark: ProgramBenchmark) {
  return {
    time: time === null ? null : time <= benchmark.targetTimeSeconds,
    fitness: fitness === null ? null : fitness >= benchmark.targetScore,
  };
}

function trendCounts(changes: MetricChange[]) {
  return {
    improved: changes.filter(change => change === "IMPROVED").length,
    unchanged: changes.filter(change => change === "WITHIN_SWC").length,
    worsened: changes.filter(change => change === "DECLINED").length,
  };
}

function computeSport(
  sport: string,
  athletes: ProgramAthleteInput[],
  benchmark: ProgramBenchmark,
  raceProxyStations: readonly string[],
  classifier: ProgramChangeClassifier,
): SportProgramAnalytics {
  const coverage: CoverageCounts = {
    total: athletes.length,
    withFitness: athletes.filter(a => a.fitnessAverage !== null).length,
    withTime: athletes.filter(a => a.timeSeconds !== null).length,
    withActionPlan: athletes.filter(a => a.hasActionPlan).length,
    withFollowUp: athletes.filter(a => a.followUp !== null).length,
  };

  const baseline = attainment(athletes.map(a => onTarget(a.timeSeconds, a.fitnessAverage, benchmark)));

  // กลุ่มทดสอบซ้ำ: เทียบ "คนเดียวกัน" ก่อน-หลัง ตัวหารเท่ากันทั้งสองฝั่ง
  const retested = athletes.filter(a => a.followUp !== null);
  const pairedTime = retested.filter(a => a.timeSeconds !== null && a.followUp?.timeSeconds != null);
  const pairedFitness = retested.filter(a => a.fitnessAverage !== null && a.followUp?.fitnessAverage != null);
  const pairedBoth = pairedTime.filter(a => pairedFitness.includes(a));

  const attainmentOf = (rows: ProgramAthleteInput[], useAfter: boolean) =>
    attainment(rows.map(a => onTarget(
      useAfter ? a.followUp?.timeSeconds ?? null : a.timeSeconds,
      useAfter ? a.followUp?.fitnessAverage ?? null : a.fitnessAverage,
      benchmark,
    )));
  const pairedAttainment = (useAfter: boolean): AttainmentSet => {
    const time = attainmentOf(pairedTime, useAfter).time;
    const fitness = attainmentOf(pairedFitness, useAfter).fitness;
    const both = attainmentOf(pairedBoth, useAfter).both;
    return { time, fitness, both };
  };

  const timePoints = pairedTime.map(a => {
    const before = a.timeSeconds as number;
    const after = a.followUp?.timeSeconds as number;
    return {
      applicationId: a.applicationId,
      gapBefore: round(before - benchmark.targetTimeSeconds, 2),
      gapAfter: round(after - benchmark.targetTimeSeconds, 2),
      // เทียบจากเวลาจริงโดยตรง (ไม่ผ่าน gap ที่ปัดแล้ว) ให้ได้ delta เดียวกับการ์ดรายคน
      change: classifier.time(before, round(after - before, 2)),
    };
  });
  const hadGap = timePoints.filter(point => point.gapBefore > 0);
  const time: TimePrePost = {
    n: timePoints.length,
    medianGapBefore: median(timePoints.map(p => p.gapBefore)),
    medianGapAfter: median(timePoints.map(p => p.gapAfter)),
    medianDelta: median(timePoints.map(p => round(p.gapAfter - p.gapBefore, 2))),
    ...trendCounts(timePoints.map(point => point.change)),
    gapClosed: { closed: hadGap.filter(p => p.gapAfter <= 0).length, hadGap: hadGap.length },
    points: timePoints,
  };

  const fitnessDeltas = pairedFitness.map(a => round((a.followUp?.fitnessAverage as number) - (a.fitnessAverage as number), 1));
  const fitness: FitnessPrePost = {
    n: pairedFitness.length,
    medianBefore: median(pairedFitness.map(a => a.fitnessAverage as number), 1),
    medianAfter: median(pairedFitness.map(a => a.followUp?.fitnessAverage as number), 1),
    medianDelta: median(fitnessDeltas, 1),
    ...trendCounts(fitnessDeltas.map(classifier.fitness)),
  };

  // ความสัมพันธ์รายสถานี: ใช้ค่า baseline คนละ 1 จุด
  const stationNames = [...new Set(athletes.flatMap(a => a.stations.map(s => s.name)))];
  const correlations: StationCorrelation[] = stationNames.map(station => {
    const pairs = athletes.flatMap(a => {
      const score = a.stations.find(s => s.name === station)?.score;
      return score === undefined || a.timeSeconds === null ? [] : [{ score, time: a.timeSeconds }];
    });
    const base = { station, n: pairs.length, rho: null, alignment: null, strength: null };
    if (raceProxyStations.includes(station)) return { ...base, status: "RACE_PROXY" as const };
    if (pairs.length < MIN_CORRELATION_SAMPLE) return { ...base, status: "INSUFFICIENT_N" as const };
    const rho = spearman(pairs.map(p => p.score), pairs.map(p => p.time));
    if (rho === null) return { ...base, status: "NO_VARIATION" as const };
    return { ...base, rho, alignment: round(-rho, 3), strength: correlationStrength(rho), status: "OK" as const };
  });
  const order: Record<CorrelationStatus, number> = { OK: 0, INSUFFICIENT_N: 1, NO_VARIATION: 2, RACE_PROXY: 3 };
  correlations.sort((a, b) => order[a.status] - order[b.status] || Math.abs(b.rho ?? 0) - Math.abs(a.rho ?? 0));

  return {
    sport,
    benchmark,
    coverage,
    baseline,
    followUp: {
      n: retested.length,
      before: pairedAttainment(false),
      after: pairedAttainment(true),
      time,
      fitness,
    },
    correlations,
  };
}

export function computeProgramAnalytics(
  athletes: ProgramAthleteInput[],
  benchmarks: Record<string, ProgramBenchmark>,
  raceProxyStations: Record<string, readonly string[]> = {},
  classifier: ProgramChangeClassifier = RAW_CHANGE_CLASSIFIER,
): ProgramAnalytics {
  const groups = new Map<string, ProgramAthleteInput[]>();
  for (const athlete of athletes) {
    const sport = normalizeProgramSport(athlete.sport);
    groups.set(sport, [...(groups.get(sport) ?? []), athlete]);
  }

  const sports: SportProgramAnalytics[] = [];
  for (const [sport, group] of groups) {
    const benchmark = benchmarks[sport] ?? (sport === "กีฬาทางน้ำ" ? benchmarks["ว่ายน้ำ"] : undefined);
    if (!benchmark) continue;
    sports.push(computeSport(sport, group, benchmark, raceProxyStations[sport] ?? [], classifier));
  }
  return { minCorrelationSample: MIN_CORRELATION_SAMPLE, sports };
}
