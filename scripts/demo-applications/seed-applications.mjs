// สคริปต์ชั่วคราว: สร้างข้อมูลใบสมัครตัวอย่างสำหรับสาธิตต่อคณะกรรมการ
// ทุกแถวที่สร้างมี id ขึ้นต้นด้วย zzdemo- และรหัสนิสิต 699000xx ลบได้ด้วย `node zz-seed-demo-apps.mjs cleanup`
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { Client } from "pg";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(readFileSync("D:/BBN/FF/.env", "utf8").split(/\r?\n/)
  .filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));

const BUCKET = env.PRIVATE_DOCUMENT_BUCKET;
const COMPETITION = "cmupxdfn50000vsc7gbbw9fz2";
const CLUB_ID = "zzdemo-club-athletics";
const IDS = ["69900001", "69900002", "69900003", "69900004", "69900005", "69900006"];
const USER = id => `zzdemo-user-${id}`;

const db = new Client({ connectionString: env.DIRECT_URL || env.DATABASE_URL });
await db.connect();
const storage = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY).storage.from(BUCKET);

const pdf = title => Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
  + "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
  + `4 0 obj<</Length 120>>stream\nBT /F1 16 Tf 60 760 Td (${title}) Tj ET\nBT /F1 11 Tf 60 720 Td (DEMO DOCUMENT - NOT A REAL RECORD) Tj ET\nendstream endobj\n`
  + "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n", "latin1");

// PNG 1x1 (ใช้แทนรูปถ่ายตัวอย่าง)
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

const DOCS = [
  ["photoFileUrl", "Student photo", "image/png", png],
  ["idCardFileUrl", "National ID card copy", "application/pdf", null],
  ["studentCardFileUrl", "Student card copy", "application/pdf", null],
  ["studentCertFileUrl", "Student status certificate", "application/pdf", null],
];

const PEOPLE = [
  {
    id: "69900001", title: "นาย", first: "เกียรติศักดิ์", last: "แสนสุข",
    faculty: "คณะวิทยาศาสตร์การกีฬา", major: "วิทยาศาสตร์การกีฬา", year: "3",
    gpax: "3.20", birth: "2004-05-14", category: "ลู่ (ชาย)", status: "STAFF_APPROVED",
    nationalId: "1509900100011", phone: "0810000001",
    history: [["SUBMITTED", "ส่งใบสมัคร", "นักกีฬา"], ["CLUB_APPROVED", "ชมรมอนุมัติ", "ชมรมกรีฑา"], ["STAFF_APPROVED", "กองกิจการนิสิตอนุมัติ", "เจ้าหน้าที่"]],
  },
  {
    id: "69900002", title: "นางสาว", first: "จิรารัตน์", last: "ดวงแก้ว",
    faculty: "คณะศิลปศาสตร์", major: "ภาษาอังกฤษ", year: "2",
    gpax: "1.85", birth: "2005-02-03", category: "ลู่ (หญิง)", status: "SUBMITTED",
    nationalId: "1509900100022", phone: "0810000002",
    history: [["SUBMITTED", "ส่งใบสมัคร", "นักกีฬา"]],
  },
  {
    id: "69900003", title: "นาย", first: "ธีรภัทร", last: "อินทจักร",
    faculty: "คณะวิศวกรรมศาสตร์", major: "วิศวกรรมโยธา", year: "4",
    gpax: "2.75", birth: "2003-11-20", category: "ลาน (ชาย)", status: "CLUB_APPROVED",
    nationalId: "1509900100033", phone: "0810000003",
    history: [["SUBMITTED", "ส่งใบสมัคร", "นักกีฬา"], ["CLUB_APPROVED", "ชมรมอนุมัติ รอกองกิจการนิสิตพิจารณา", "ชมรมกรีฑา"]],
  },
  // สามรายต่อไปนี้อนุมัติแล้ว จึงเข้าเงื่อนไขของหน้าสู่ความเป็นเลิศ (STAFF_APPROVED / FINAL_SELECTED)
  {
    id: "69900004", title: "นางสาว", first: "ศิริพร", last: "ทองใบ",
    faculty: "คณะวิทยาศาสตร์", major: "คณิตศาสตร์", year: "3",
    gpax: "3.05", birth: "2004-07-09", category: "ลู่ (หญิง)", status: "STAFF_APPROVED",
    nationalId: "1509900100044", phone: "0810000004",
    history: [["SUBMITTED", "ส่งใบสมัคร", "นักกีฬา"], ["CLUB_APPROVED", "ชมรมอนุมัติ", "ชมรมกรีฑา"], ["STAFF_APPROVED", "กองกิจการนิสิตอนุมัติ", "เจ้าหน้าที่"]],
  },
  {
    id: "69900005", title: "นาย", first: "ชนาธิป", last: "ก้องเกียรติ",
    faculty: "คณะสถาปัตยกรรมศาสตร์และศิลปกรรมศาสตร์", major: "สถาปัตยกรรม", year: "4",
    gpax: "2.90", birth: "2003-08-25", category: "ลาน (ชาย)", status: "STAFF_APPROVED",
    nationalId: "1509900100055", phone: "0810000005",
    history: [["SUBMITTED", "ส่งใบสมัคร", "นักกีฬา"], ["CLUB_APPROVED", "ชมรมอนุมัติ", "ชมรมกรีฑา"], ["STAFF_APPROVED", "กองกิจการนิสิตอนุมัติ", "เจ้าหน้าที่"]],
  },
  {
    id: "69900006", title: "นางสาว", first: "กานต์ธิดา", last: "พรมมา",
    faculty: "คณะพยาบาลศาสตร์", major: "พยาบาลศาสตร์", year: "2",
    gpax: "3.40", birth: "2005-01-16", category: "ลู่ (หญิง)", status: "STAFF_APPROVED",
    nationalId: "1509900100066", phone: "0810000006",
    history: [["SUBMITTED", "ส่งใบสมัคร", "นักกีฬา"], ["CLUB_APPROVED", "ชมรมอนุมัติ", "ชมรมกรีฑา"], ["STAFF_APPROVED", "กองกิจการนิสิตอนุมัติ", "เจ้าหน้าที่"]],
  },
];

async function cleanup() {
  const owners = IDS.map(USER);
  const docs = await db.query('SELECT path FROM "PrivateDocument" WHERE "ownerId" = ANY($1)', [owners]);
  if (docs.rows.length) {
    const { error } = await storage.remove(docs.rows.map(r => r.path));
    if (error) console.warn("storage remove:", error.message);
  }
  await db.query('DELETE FROM "PrivateDocument" WHERE "ownerId" = ANY($1)', [owners]);
  // แถวที่อ้างใบสมัครแบบ Restrict ต้องไปก่อน (roster, ผลแข่ง, ผลสมรรถภาพ)
  const apps = IDS.map(id => `zzdemo-app-${id}`);
  await db.query('DELETE FROM "ClubRoster" WHERE id = $1', ["zzdemo-roster-athletics"]);
  await db.query('DELETE FROM "CompetitionMatchEntry" WHERE "applicationId" = ANY($1)', [apps]);
  await db.query(
    'DELETE FROM "CompetitionMatch" m WHERE m.sport = $1 AND m."competitionId" = $2'
    + ' AND NOT EXISTS (SELECT 1 FROM "CompetitionMatchEntry" e WHERE e."matchId" = m.id)', ["กรีฑา", COMPETITION]);
  await db.query('DELETE FROM "FitnessTestResult" WHERE "applicationId" = ANY($1)', [apps]);
  // ลบ User แล้ว Application / AthleteProfile / StatusHistory ตามไปด้วย (onDelete: Cascade)
  await db.query('DELETE FROM "User" WHERE id = ANY($1)', [owners]);
  await db.query('DELETE FROM "Club" WHERE id = $1', [CLUB_ID]);
  await db.query('DELETE FROM "SportQuota" WHERE id = $1', ["zzdemo-quota-athletics"]);
  const left = await db.query(
    'SELECT (SELECT count(*) FROM "User" WHERE id = ANY($1))::int u,'
    + ' (SELECT count(*) FROM "Application" WHERE "userId" = ANY($1))::int a,'
    + ' (SELECT count(*) FROM "PrivateDocument" WHERE "ownerId" = ANY($1))::int d,'
    + ' (SELECT count(*) FROM "Club" WHERE id = $2)::int c', [owners, CLUB_ID]);
  console.log("remaining after cleanup:", left.rows[0]);
}

async function seed() {
  await cleanup();
  const passwords = [];

  await db.query(
    'INSERT INTO "SportQuota" (id, "competitionId", sport, "maxStarters", "maxSubstitutes", "ageLimit")'
    + " VALUES ($1,$2,'กรีฑา',1,0,28)", ["zzdemo-quota-athletics", COMPETITION]);

  const clubPassword = randomBytes(12).toString("base64url");
  await db.query(
    'INSERT INTO "Club" (id, name, sport, email, password, "mustChangePassword", "isActive", "presidentName", "presidentPhone", status, "createdAt")'
    + " VALUES ($1,'ชมรมกรีฑา','กรีฑา','athletics.demo@up.ac.th',$2,true,true,'นายสมชาย ใจดี','0819999999','ACTIVE',now())",
    [CLUB_ID, await bcrypt.hash(clubPassword, 10)]);
  passwords.push(`ชมรมกรีฑา · athletics.demo@up.ac.th · ${clubPassword}`);

  for (const p of PEOPLE) {
    const userId = USER(p.id);
    const password = randomBytes(12).toString("base64url");
    passwords.push(`${p.title}${p.first} ${p.last} · ${p.id}@up.ac.th · ${password}`);

    await db.query(
      'INSERT INTO "User" (id, "studentId", email, password, "mustChangePassword", role, "isActive", "createdAt", "updatedAt")'
      + " VALUES ($1,$2,$3,$4,true,'ATHLETE',true,now(),now())",
      [userId, p.id, `${p.id}@up.ac.th`, await bcrypt.hash(password, 10)]);

    await db.query(
      'INSERT INTO "AthleteProfile" (id,"userId","firstName","lastName",faculty,major,"studentLevel",year,semester,'
      + '"nationalId",nationality,"birthDate","gpaSemester","gpaCumulative","addressNo","subDistrict",district,province,'
      + '"postalCode",phone,"hasParticipated","isNationalTeam","createdAt","updatedAt")'
      + " VALUES ($1,$2,$3,$4,$5,$6,'BACHELOR',$7,'1',$8,'ไทย',$9,$10,$11,'99/9','แม่กา','เมืองพะเยา','พะเยา','56000',$12,false,false,now(),now())",
      [`zzdemo-profile-${p.id}`, userId, `${p.title}${p.first}`, p.last, p.faculty, p.major, p.year,
        p.nationalId, new Date(p.birth), p.gpax, p.gpax, p.phone]);

    const fields = {};
    for (const [field, label, mime, fixed] of DOCS) {
      const bytes = fixed ?? pdf(`${label} - ${p.id}`);
      const path = `${userId}/${randomUUID()}`;
      const { error } = await storage.upload(path, bytes, { contentType: mime, upsert: false });
      if (error) throw new Error(`upload ${field}: ${error.message}`);
      const docId = `zzdemo-doc-${p.id}-${field}`;
      await db.query(
        'INSERT INTO "PrivateDocument" (id,"ownerId","ownerRole",purpose,path,name,"mimeType",size,state,retained,"createdAt")'
        + " VALUES ($1,$2,'ATHLETE','ATHLETE',$3,$4,$5,$6,'READY',true,now())",
        [docId, userId, path, `${label}.${mime === "image/png" ? "png" : "pdf"}`, mime, bytes.length]);
      fields[field] = `/api/documents/${docId}/download`;
    }

    const appId = `zzdemo-app-${p.id}`;
    await db.query(
      'INSERT INTO "Application" (id,"userId","competitionId",sport,category,division,status,"photoFileUrl",'
      + '"idCardFileUrl","studentCardFileUrl","studentCertFileUrl","upAcademyFileUrl","fitnessTestFileUrl","clubId","createdAt","updatedAt")'
      + " VALUES ($1,$2,$3,'กรีฑา',$4,'ทั่วไป',$5,$6,$7,$8,$9,'-','-',$10,now(),now())",
      [appId, userId, COMPETITION, p.category, p.status,
        fields.photoFileUrl, fields.idCardFileUrl, fields.studentCardFileUrl, fields.studentCertFileUrl, CLUB_ID]);

    let i = 0;
    for (const [status, label, by] of p.history) {
      await db.query(
        'INSERT INTO "StatusHistory" (id,"applicationId",status,label,by,"createdAt")'
        + " VALUES ($1,$2,$3,$4,$5, now() - ($6 || ' hours')::interval)",
        [`zzdemo-hist-${p.id}-${i}`, appId, status, label, by, String((p.history.length - i) * 24)]);
      i++;
    }
  }

  writeFileSync(process.argv[3], passwords.join("\n") + "\n", "utf8");
  console.log(`seeded ${PEOPLE.length} applications; credentials written to ${process.argv[3]}`);
}

const mode = process.argv[2];
if (mode === "seed") await seed();
else if (mode === "cleanup") await cleanup();
else console.log("usage: node zz-seed-demo-apps.mjs seed <credentialsFile> | cleanup");
await db.end();
