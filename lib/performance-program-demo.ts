// ชุดข้อมูลจำลอง (cohort) สำหรับมุมมองโปรแกรมของแท็บ Excellence เท่านั้น
// สร้างแบบกำหนดค่าตายตัว (seeded) ไม่ใช้ข้อมูลจริง และไม่ปะปนกับข้อมูลจริง
// ความสัมพันธ์ที่เห็นในชุดนี้ถูกกำหนดขึ้นเองโดยตั้งใจ จึงห้ามอ้างเป็นผลวิจัยจริง
import type { ProgramAthleteInput, ProgramBenchmark } from "./performance-program-analytics";

type DemoSportConfig = {
  seed: number;
  // ความสามารถแฝง 0-100 ของนักกีฬาแต่ละคน
  abilities: number[];
  // เวลาที่ต่างจากเป้าหมายเมื่อ ability ต่างจาก 60 อยู่ 50 คะแนน
  timeSpanSeconds: number;
  noiseTimeSeconds: number;
  // ชื่อสถานีที่ตรงกับคำใด ใช้ noise ตามคำนั้น (ค่าน้อย = สอดคล้องกับความสามารถ/เวลามาก)
  stationNoise: { match: string; noise: number }[];
  // index ของนักกีฬาที่ไม่มีผลเวลาแข่ง
  noTime: number[];
  // index -> ability ที่เพิ่มขึ้นหลังทดสอบซ้ำ
  retestGain: Record<number, number>;
  // index ที่มีแผนพัฒนาแต่ยังไม่ทดสอบซ้ำ
  planOnly: number[];
};

const DEFAULT_STATION_NOISE = 60;

const CONFIGS: Record<string, DemoSportConfig> = {
  "กรีฑา": {
    seed: 4021,
    abilities: [96, 91, 82, 71, 66, 61, 55, 50, 44, 38, 31, 25],
    timeSpanSeconds: 0.5,
    noiseTimeSeconds: 0.06,
    stationNoise: [
      { match: "40m Sprint", noise: 4 },
      { match: "Leg Power", noise: 18 },
      { match: "Agility", noise: 30 },
      { match: "Aerobic", noise: 45 },
      { match: "Sit & Reach", noise: 90 },
      { match: "Body Composition", noise: 90 },
      { match: "Grip", noise: 80 },
    ],
    noTime: [11],
    retestGain: { 3: 8, 4: 12, 5: 6, 6: 15, 7: 10, 8: 14, 9: 9, 10: 18 },
    planOnly: [11],
  },
  "กีฬาทางน้ำ": {
    seed: 7713,
    abilities: [91, 84, 79, 73, 68, 62, 57, 52, 46, 40, 33, 27],
    timeSpanSeconds: 2.4,
    noiseTimeSeconds: 0.25,
    stationNoise: [
      { match: "Aerobic", noise: 20 },
      { match: "Leg Power", noise: 28 },
      { match: "Sit-ups", noise: 38 },
      { match: "Push-ups", noise: 50 },
      { match: "Grip", noise: 75 },
      { match: "Sit & Reach", noise: 90 },
      { match: "Back Extension", noise: 90 },
      { match: "Body Composition", noise: 90 },
    ],
    noTime: [11],
    retestGain: { 2: 7, 3: 10, 4: 13, 5: 8, 6: 16, 7: 11, 8: 9, 9: 17 },
    planOnly: [10, 11],
  },
};

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ค่าสุ่มเฉลี่ย 0 กระจายคล้ายระฆัง (ผลรวมของ 3 ค่าสุ่มสม่ำเสมอ) อยู่ในช่วง -1..1
function noiseUnit(random: () => number): number {
  return (random() + random() + random()) / 1.5 - 1;
}

const RATING_STEPS = [
  { min: 90, score: 100 },
  { min: 70, score: 80 },
  { min: 50, score: 60 },
  { min: 30, score: 40 },
  { min: 10, score: 20 },
  { min: -Infinity, score: 0 },
];

function abilityToScore(ability: number): number {
  return RATING_STEPS.find(step => ability >= step.min)?.score ?? 0;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mean(values: number[]): number {
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function generateDemoCohort(
  sport: string,
  stationNames: readonly string[],
  benchmark: ProgramBenchmark,
): ProgramAthleteInput[] {
  const config = CONFIGS[sport];
  if (!config) return [];
  const random = mulberry32(config.seed);
  const noiseFor = (station: string) =>
    config.stationNoise.find(rule => station.includes(rule.match))?.noise ?? DEFAULT_STATION_NOISE;
  const timeFor = (ability: number) =>
    round(
      benchmark.targetTimeSeconds
        + config.timeSpanSeconds * ((60 - ability) / 50)
        + noiseUnit(random) * config.noiseTimeSeconds,
      2,
    );
  const stationsFor = (ability: number) =>
    stationNames.map(name => ({ name, score: abilityToScore(ability + noiseUnit(random) * noiseFor(name)) }));

  return config.abilities.map((ability, index) => {
    const stations = stationsFor(ability);
    const gain = config.retestGain[index];
    const retest = gain === undefined
      ? null
      : (() => {
          const next = ability + gain;
          return {
            fitnessAverage: mean(stationsFor(next).map(s => s.score)),
            timeSeconds: timeFor(next),
          };
        })();
    return {
      applicationId: `demo-cohort-${sport === "กรีฑา" ? "track" : "aqua"}-${String(index + 1).padStart(2, "0")}`,
      sport,
      fitnessAverage: mean(stations.map(s => s.score)),
      timeSeconds: config.noTime.includes(index) ? null : timeFor(ability),
      stations,
      hasActionPlan: retest !== null || config.planOnly.includes(index),
      followUp: retest,
    };
  });
}
