// ชั่วคราว: เพิ่มผลทดสอบสมรรถภาพกลุ่ม 9 (ตัวเลขดิบ) ผลแข่ง เป้าหมาย แผนพัฒนา และผลทดสอบซ้ำ
// ให้นักกีฬาตัวอย่างที่อนุมัติแล้ว เพื่อให้หน้าสู่ความเป็นเลิศสาธิตด้วยข้อมูลจริงได้ (ไม่ต้องใช้ ?demo=true)
// ต้องรัน seed-applications.mjs ก่อน
import { readFileSync } from "node:fs";
import { Client } from "pg";

const env = Object.fromEntries(readFileSync("D:/BBN/FF/.env", "utf8").split(/\r?\n/)
  .filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));

const COMPETITION = "cmupxdfn50000vsc7gbbw9fz2";
const SETTING_KEY = "ATHLETICS_TRACK_BENCHMARKS";
const COACH = "อ.สมชาย ใจดี (โค้ชกรีฑา)";

// เป้าหมายรายรายการ+เพศ ที่สคริปต์นี้เป็นเจ้าของ (คีย์อื่นใน SystemSetting ไม่ถูกแตะ)
// 200m ตั้งใจไม่ตั้งเป้า เพื่อให้เห็นสถานะ "ยังไม่ตั้งเป้า"
const BENCHMARKS = {
  "100m|ชาย": 11.0,
  "100m|หญิง": 12.6,
  "400m|หญิง": 60.0,
  "longJump|ชาย": 7.2,
};

// ค่าตัวเลขดิบของ 11 สถานีตามเกณฑ์กลุ่ม 9 (lib/fitness-group9-norms.ts) ระดับที่ระบบจะคำนวณได้อยู่ในคอมเมนต์
const ATHLETES = [
  {
    id: "69900001", category: "ลู่ (ชาย)", testedAt: "2026-02-10",
    stations: {
      bodyFatPercent: 10.5,        // ดี
      sitAndReachCm: 18,           // ปานกลาง
      backExtensionCm: 52,         // ปานกลาง
      gripStrengthRatio: 0.74,     // ปานกลาง
      legStrengthRatio: 2.3,       // ต่ำ  ← จุดอ่อน
      sitUps1Min: 48,              // ปานกลาง
      pushUps1Min: 42,             // ปานกลาง
      sprint40mSec: 6.2,           // ต่ำ  ← จุดอ่อน
      wingatePowerWkg: 10.3,       // ปานกลาง
      wingateCapacityWkg: 8.2,     // ปานกลาง
      vo2maxMlKgMin: 44.0,         // ปานกลาง
    },
    results: [
      { event: "100m", mark: 11.52, date: "2026-03-14", stage: "รอบชิงชนะเลิศ" },
      { event: "100m", mark: 11.34, date: "2026-08-22", stage: "รอบชิงชนะเลิศ" },
    ],
    plan: {
      id: "zzdemo-plan-69900001", startDate: "2026-08-25", endDate: "2026-10-20", status: "ACTIVE",
      items: [
        { id: "zzdemo-planitem-1", stationKey: "legStrengthRatio", activity: "Squat และ plyometrics (box jump, bounding) สัปดาห์ละ 2 ครั้ง" },
        { id: "zzdemo-planitem-2", stationKey: "sprint40mSec", activity: "ฝึกออกตัวจากบล็อกและเร่งความเร็วช่วง 30 เมตรแรก" },
      ],
      notes: "เน้นแรงระเบิดขาและช่วงออกตัว",
    },
    retest: {
      id: "zzdemo-retest-69900001", testedAt: "2026-10-05",
      ratings: { legStrengthRatio: "ปานกลาง", sprint40mSec: "ปานกลาง" },
      event: "100m", mark: 11.18,
      notes: "ทดสอบซ้ำหลังจบแผน 6 สัปดาห์",
    },
  },
  {
    id: "69900004", category: "ลู่ (หญิง)", testedAt: "2026-02-10",
    stations: {
      bodyFatPercent: 22.0,        // ดี
      sitAndReachCm: 24,           // ดี
      backExtensionCm: 50,         // ปานกลาง
      gripStrengthRatio: 0.62,     // ดี
      legStrengthRatio: 2.85,      // ดี
      sitUps1Min: 46,              // ปานกลาง
      pushUps1Min: 35,             // ปานกลาง
      sprint40mSec: 6.8,           // ดี
      wingatePowerWkg: 7.9,        // ปานกลาง
      wingateCapacityWkg: 6.4,     // ปานกลาง
      vo2maxMlKgMin: 33.0,         // ปานกลาง
    },
    // 100 ม. ถึงเป้า · 200 ม. ยังไม่ตั้งเป้า
    results: [
      { event: "100m", mark: 12.48, date: "2026-08-22", stage: "รอบชิงชนะเลิศ" },
      { event: "200m", mark: 25.80, date: "2026-08-23", stage: "รอบชิงชนะเลิศ" },
    ],
    plan: null,
    retest: null,
  },
  {
    id: "69900005", category: "ลาน (ชาย)", testedAt: "2026-02-11",
    stations: {
      bodyFatPercent: 11.0,        // ดี
      sitAndReachCm: 12,           // ต่ำ  ← จุดอ่อน
      backExtensionCm: 51,         // ปานกลาง
      gripStrengthRatio: 0.73,     // ปานกลาง
      legStrengthRatio: 3.2,       // ดี
      sitUps1Min: 50,              // ปานกลาง
      pushUps1Min: 45,             // ปานกลาง
      sprint40mSec: 5.7,           // ปานกลาง
      wingatePowerWkg: 11.0,       // ดี
      wingateCapacityWkg: 8.5,     // ปานกลาง
      vo2maxMlKgMin: 44.0,         // ปานกลาง
    },
    results: [{ event: "longJump", mark: 7.12, date: "2026-08-22", stage: "รอบชิงชนะเลิศ" }],
    // แผนหมดกำหนดแล้วแต่ยังไม่ทดสอบซ้ำ → ขึ้นในรายการ "แผนเลยกำหนดแต่ยังไม่ทดสอบซ้ำ"
    plan: {
      id: "zzdemo-plan-69900005", startDate: "2026-06-01", endDate: "2026-09-15", status: "ACTIVE",
      items: [{ id: "zzdemo-planitem-3", stationKey: "sitAndReachCm", activity: "ยืดเหยียดกล้ามเนื้อหลังต้นขาและสะโพกทุกวันหลังซ้อม" }],
      notes: null,
    },
    retest: null,
  },
  {
    id: "69900006", category: "ลู่ (หญิง)", testedAt: "2026-02-11",
    stations: {
      bodyFatPercent: 25.0,        // ปานกลาง
      sitAndReachCm: 18,           // ปานกลาง
      backExtensionCm: 48,         // ปานกลาง
      gripStrengthRatio: 0.5,      // ต่ำมาก ← จุดอ่อน
      legStrengthRatio: 2.2,       // ปานกลาง
      sitUps1Min: 45,              // ปานกลาง
      pushUps1Min: 34,             // ปานกลาง
      sprint40mSec: 7.0,           // ปานกลาง
      wingatePowerWkg: 7.9,        // ปานกลาง
      wingateCapacityWkg: 6.5,     // ปานกลาง
      vo2maxMlKgMin: 33.0,         // ปานกลาง
    },
    // ยังไม่มีผลแข่ง และมีจุดอ่อนแต่ยังไม่มีแผน → ขึ้นทั้งสองรายการใน "ต้องติดตาม"
    results: [],
    plan: null,
    retest: null,
  },
];

const TRACK_EVENTS = new Set(["100m", "200m", "400m", "800m", "1500m", "5000m", "10000m", "100mH", "110mH", "400mH"]);
const appId = id => `zzdemo-app-${id}`;

const db = new Client({ connectionString: env.DIRECT_URL || env.DATABASE_URL });
await db.connect();

async function removeBenchmarks() {
  const row = await db.query('SELECT value FROM "SystemSetting" WHERE key = $1', [SETTING_KEY]);
  if (!row.rows.length) return;
  const value = row.rows[0].value && typeof row.rows[0].value === "object" ? { ...row.rows[0].value } : {};
  for (const key of Object.keys(BENCHMARKS)) delete value[key];
  await db.query('UPDATE "SystemSetting" SET value = $2 WHERE key = $1', [SETTING_KEY, JSON.stringify(value)]);
}

async function cleanup() {
  const ids = ATHLETES.map(a => appId(a.id));
  await db.query('DELETE FROM "CompetitionMatchEntry" WHERE "applicationId" = ANY($1)', [ids]);
  // ลบ match ของกรีฑาที่ไม่มีผลเหลืออยู่แล้ว (เหมือน removeEmptyMatch ของ excellence-service)
  await db.query(
    'DELETE FROM "CompetitionMatch" m WHERE m.sport = $1 AND m."competitionId" = $2'
    + ' AND NOT EXISTS (SELECT 1 FROM "CompetitionMatchEntry" e WHERE e."matchId" = m.id)', ["กรีฑา", COMPETITION]);
  await db.query('DELETE FROM "FitnessTestResult" WHERE "applicationId" = ANY($1)', [ids]);
  await removeBenchmarks();
  const left = await db.query(
    'SELECT (SELECT count(*) FROM "FitnessTestResult" WHERE "applicationId" = ANY($1))::int f,'
    + ' (SELECT count(*) FROM "CompetitionMatchEntry" WHERE "applicationId" = ANY($1))::int e,'
    + ' (SELECT count(*) FROM "CompetitionMatch" WHERE sport = $2)::int m', [ids, "กรีฑา"]);
  console.log("remaining after cleanup:", left.rows[0]);
}

async function matchFor(category, event, date, stage) {
  const eventType = TRACK_EVENTS.has(event) ? "TIMED" : "RANKING";
  const scheduledAt = new Date(`${date}T00:00:00.000Z`);
  const found = await db.query(
    'SELECT id FROM "CompetitionMatch" WHERE "competitionId" = $1 AND sport = $2 AND category = $3'
    + ' AND division = $4 AND "eventType" = $5::"CompetitionEventType" AND "scheduledAt" = $6 AND stage = $7',
    [COMPETITION, "กรีฑา", category, event, eventType, scheduledAt, stage]);
  if (found.rows.length) return found.rows[0].id;
  // match แยกตามประเภท (category) ด้วย เพราะ 100 ม. ชายและหญิงวันเดียวกันเป็นสอง match
  const id = `zzdemo-match-${event}-${date}-${category.replace(/[^฀-๿a-zA-Z]/g, "")}`;
  await db.query(
    'INSERT INTO "CompetitionMatch" (id,"competitionId",sport,category,division,"eventType",stage,"scheduledAt",status,"createdAt","updatedAt")'
    + ' VALUES ($1,$2,$3,$4,$5,$6::"CompetitionEventType",$7,$8,$9,now(),now())',
    [id, COMPETITION, "กรีฑา", category, event, eventType, stage, scheduledAt, "COMPLETED"]);
  return id;
}

async function seed() {
  await cleanup();

  const row = await db.query('SELECT value FROM "SystemSetting" WHERE key = $1', [SETTING_KEY]);
  const value = row.rows.length && row.rows[0].value && typeof row.rows[0].value === "object" ? { ...row.rows[0].value } : {};
  for (const [key, target] of Object.entries(BENCHMARKS)) {
    value[key] = { target, updatedAt: new Date().toISOString(), updatedBy: "ข้อมูลตัวอย่างสำหรับนำเสนอ" };
  }
  if (row.rows.length) await db.query('UPDATE "SystemSetting" SET value = $2 WHERE key = $1', [SETTING_KEY, JSON.stringify(value)]);
  else await db.query('INSERT INTO "SystemSetting" (id,key,value,"updatedAt") VALUES ($1,$2,$3,now())', ["zzdemo-setting-benchmarks", SETTING_KEY, JSON.stringify(value)]);

  for (const athlete of ATHLETES) {
    const application = appId(athlete.id);
    const exists = await db.query('SELECT status FROM "Application" WHERE id = $1', [application]);
    if (!exists.rows.length) throw new Error(`ไม่พบใบสมัคร ${application} — รัน seed-applications.mjs ก่อน`);

    const storage = { revision: 1, plans: [], retests: [] };
    if (athlete.plan) {
      storage.plans.push({ ...athlete.plan, coachName: COACH, updatedAt: new Date().toISOString(), updatedBy: "ข้อมูลตัวอย่างสำหรับนำเสนอ" });
    }
    if (athlete.retest) {
      storage.retests.push({
        ...athlete.retest, planId: athlete.plan ? athlete.plan.id : null,
        recordedAt: new Date().toISOString(), recordedBy: "ข้อมูลตัวอย่างสำหรับนำเสนอ",
      });
    }
    // ตัวเลขดิบอยู่ใต้ items ตามคีย์กลุ่ม 9 ระบบจะตัดระดับให้เองตามเพศ (rateGroup9Value)
    const scores = { items: athlete.stations, _excellence: { v2: storage } };

    await db.query(
      'INSERT INTO "FitnessTestResult" (id,"applicationId",status,scores,notes,"testedAt","recordedBy","createdAt","updatedAt")'
      + " VALUES ($1,$2,'PASSED',$3,$4,$5,$6,now(),now())",
      [`zzdemo-fitness-${athlete.id}`, application, JSON.stringify(scores),
        "ผลทดสอบตัวอย่างสำหรับการนำเสนอ", new Date(`${athlete.testedAt}T00:00:00.000Z`), "ข้อมูลตัวอย่างสำหรับนำเสนอ"]);

    let index = 0;
    for (const result of athlete.results) {
      const matchId = await matchFor(athlete.category, result.event, result.date, result.stage);
      const isTrack = TRACK_EVENTS.has(result.event);
      await db.query(
        'INSERT INTO "CompetitionMatchEntry" (id,"matchId","applicationId","participantName","timeSeconds",score,"createdAt")'
        + " VALUES ($1,$2,$3,$4,$5,$6,now())",
        [`zzdemo-entry-${athlete.id}-${index}`, matchId, application, null,
          isTrack ? result.mark : null, isTrack ? null : result.mark]);
      index += 1;
    }
  }
  console.log(`seeded fitness + results for ${ATHLETES.length} athletes and ${Object.keys(BENCHMARKS).length} benchmarks`);
}

const mode = process.argv[2];
if (mode === "seed") await seed();
else if (mode === "cleanup") await cleanup();
else console.log("usage: node scripts/demo-applications/seed-excellence.mjs seed | cleanup");
await db.end();
