import "dotenv/config";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

if (!process.env.TEST_DATABASE_URL || process.env.TEST_ALLOW_WRITE !== "yes") throw new Error("Explicit test database and TEST_ALLOW_WRITE=yes required");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL }) });
const path = "test-results/regression-ui-fixtures.json";
const mode = process.argv[2];
try {
  if (mode === "create") {
    if (fs.existsSync(path)) throw new Error("Clean up the existing fixture manifest first");
    const state = { tag: "ui-" + randomUUID().slice(0, 8), users: [], clubs: [], competitions: [], applications: [] };
    const save = () => fs.writeFileSync(path, JSON.stringify(state, null, 2));
    save();
    const password = await bcrypt.hash("Fixture!Ui2026", 4);
    for (const role of ["ADMIN", "STAFF", "ATHLETE", "TEAM_OFFICIAL"]) {
      const row = await db.user.create({ data: { role, email: state.tag + "-" + role.toLowerCase() + "@example.test", password, ...(role === "ATHLETE" ? { studentId: "6" + Date.now().toString().slice(-7), profile: { create: { firstName: "Fixture", lastName: state.tag, faculty: "Test", major: "Test", year: "1", nationalId: "1234567890123", birthDate: new Date("2005-01-01"), addressNo: "1", subDistrict: "Test", district: "Test", province: "Test", postalCode: "56000", phone: "0800000000", gpaCumulative: "3.5" } } } : {}) } });
      state.users.push({ id: row.id, email: row.email, role, studentId: row.studentId }); save();
    }
    const club = await db.club.create({ data: { name: state.tag + " ชมรมทดสอบ", email: state.tag + "-club@example.test", password, sport: state.tag + " sport", status: "ACTIVE", presidentName: "Fixture President" } });
    state.clubs.push({ id: club.id, email: club.email, name: club.name }); save();
    for (const label of ["มีบัญชีชมรม", "ยังไม่มีบัญชีชมรม", "ไม่มีใบสมัคร"]) {
      const competition = await db.competition.create({ data: { name: state.tag + " " + label, round: "qualifier", year: 2569, status: "OPEN", deadline: new Date(Date.now() + 86400000), quotas: { create: { sport: club.sport, maxStarters: 2, maxSubstitutes: 1 } } } });
      state.competitions.push({ id: competition.id, name: competition.name }); save();
      if (label === "ไม่มีใบสมัคร") continue;
      const docs = Object.fromEntries(["photoFileUrl", "idCardFileUrl", "studentCardFileUrl", "studentCertFileUrl", "upAcademyFileUrl", "fitnessTestFileUrl"].map(k => [k, "https://example.test/fixture.pdf"]));
      const app = await db.application.create({ data: { userId: state.users.find(u => u.role === "ATHLETE").id, competitionId: competition.id, sport: club.sport, category: "ทั่วไป", ...docs } });
      state.applications.push(app.id); save();
      if (label === "มีบัญชีชมรม") await db.clubRoster.create({ data: { clubId: club.id, competitionId: competition.id, items: { create: { applicationId: app.id, squadType: "main" } } } });
    }
    console.log(JSON.stringify(state));
  } else if (mode === "cleanup") {
    const state = JSON.parse(fs.readFileSync(path, "utf8"));
    const users = state.users.map(x => x.id), clubs = state.clubs.map(x => x.id), competitions = state.competitions.map(x => x.id);
    await db.$transaction(async tx => {
      await tx.analyticsSnapshot.deleteMany({ where: { authorId: { in: users } } });
      await tx.clubRoster.deleteMany({ where: { competitionId: { in: competitions } } });
      await tx.application.deleteMany({ where: { competitionId: { in: competitions } } });
      await tx.competition.deleteMany({ where: { id: { in: competitions } } });
      await tx.club.deleteMany({ where: { id: { in: clubs } } });
      await tx.user.deleteMany({ where: { id: { in: users } } });
    }, { timeout: 30000 });
    const remaining = await db.user.count({ where: { id: { in: users } } }) + await db.club.count({ where: { id: { in: clubs } } }) + await db.competition.count({ where: { id: { in: competitions } } });
    if (remaining) throw new Error("Fixture cleanup incomplete");
    fs.unlinkSync(path);
    console.log("UI fixture cleanup PASS; remaining 0");
  } else throw new Error("Use create or cleanup");
} finally { await db.$disconnect(); }
