// ชั่วคราว: เพิ่มบัญชีรายชื่อชมรม (roster) ที่ส่งแล้ว ให้ใบสมัครตัวอย่างปรากฏในหน้าเจ้าหน้าที่
import { readFileSync } from "node:fs";
import { Client } from "pg";
const env = Object.fromEntries(readFileSync("D:/BBN/FF/.env", "utf8").split(/\r?\n/)
  .filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const COMPETITION = "cmupxdfn50000vsc7gbbw9fz2";
const CLUB_ID = "zzdemo-club-athletics";
const ROSTER = "zzdemo-roster-athletics";
// กรีฑาเป็นกีฬาประเภทบุคคล roster จึงต้องใช้ squadType "selected" (lib/sport-type.ts)
const SQUADS = { "69900001": "selected", "69900002": "selected", "69900003": "selected" };
const db = new Client({ connectionString: env.DIRECT_URL || env.DATABASE_URL });
await db.connect();
if (process.argv[2] === "seed") {
  await db.query('DELETE FROM "ClubRoster" WHERE id = $1', [ROSTER]);
  await db.query(
    'INSERT INTO "ClubRoster" (id,"clubId","competitionId",status,version,"submittedBy","submittedAt","updatedAt")'
    + " VALUES ($1,$2,$3,'SUBMITTED',1,'นายสมชาย ใจดี', now() - interval '3 days', now())",
    [ROSTER, CLUB_ID, COMPETITION]);
  for (const [id, squad] of Object.entries(SQUADS)) {
    await db.query(
      'INSERT INTO "RosterItem" (id,"rosterId","applicationId","squadType") VALUES ($1,$2,$3,$4)',
      [`zzdemo-rosteritem-${id}`, ROSTER, `zzdemo-app-${id}`, squad]);
    await db.query('UPDATE "Application" SET "squadType" = $2 WHERE id = $1', [`zzdemo-app-${id}`, squad]);
  }
  console.log("roster seeded with", Object.keys(SQUADS).length, "items");
} else {
  const r = await db.query('DELETE FROM "ClubRoster" WHERE id = $1', [ROSTER]);
  console.log("deleted rosters", r.rowCount);
}
await db.end();
