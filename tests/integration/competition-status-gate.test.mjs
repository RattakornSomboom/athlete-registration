import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

if (
  !process.env.TEST_BASE_URL ||
  !process.env.TEST_DATABASE_URL ||
  process.env.TEST_ALLOW_WRITE !== "yes"
)
  throw new Error(
    "Set TEST_BASE_URL, TEST_DATABASE_URL and TEST_ALLOW_WRITE=yes explicitly; test database only."
  );
const base = new URL(process.env.TEST_BASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname))
  throw new Error("Integration runner requires a local test server.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL }),
});
const tag = "csg-" + randomUUID();
const password = "Test!" + randomUUID();
const documentIds = [];
const storage = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const userIds = [];
const competitionIds = [];
const emails = [];
const log = [];
const statePath = "test-results/competition-status-gate-fixtures.json";

function state() {
  fs.mkdirSync("test-results", { recursive: true });
  fs.writeFileSync(
    statePath,
    JSON.stringify({ tag, userIds, competitionIds, emails }, null, 2)
  );
}

async function call(path, cookie = "", data, method = data === undefined ? "GET" : "POST", expected = 200) {
  const response = await fetch(base.origin + path, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(data !== undefined && !(data instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body:
      data === undefined
        ? undefined
        : data instanceof FormData
        ? data
        : JSON.stringify(data),
    redirect: "manual",
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = {};
  }
  if (expected !== null)
    assert.equal(
      response.status,
      expected,
      method + " " + path + " status; " + (json.error || "")
    );
  assert.ok(
    !text.includes('"password"'),
    "Response must not expose password fields"
  );
  return { response, json };
}

async function login(username) {
  const { response } = await call("/api/auth/login", "", { username, password });
  const token = response.headers
    .getSetCookie()
    .find((s) => s.startsWith("token="));
  assert.ok(token, "login returns token");
  return token.split(";")[0];
}

async function makeAthlete(index) {
  const email = tag + "-" + index + "@example.test";
  emails.push(email);
  const studentId = "6" + String(Date.now() + index).slice(-7);
  const u = await prisma.user.create({
    data: {
      role: "ATHLETE",
      email,
      studentId,
      password: await bcrypt.hash(password, 4),
      profile: {
        create: {
          firstName: "Gate",
          lastName: "Fixture" + index,
          faculty: "Science",
          major: "Test",
          year: "1",
          nationalId: "1234567890123",
          birthDate: new Date("2005-01-01"),
          addressNo: "1",
          subDistrict: "Test",
          district: "Test",
          province: "Test",
          postalCode: "56000",
          phone: "0800000000",
        },
      },
    },
  });
  userIds.push(u.id);
  state();
  return u;
}

async function makeCompetition(overrides = {}) {
  const sport = tag + "-sport";
  const c = await prisma.competition.create({
    data: {
      name: tag + "-" + randomUUID().slice(0, 8),
      round: "Test",
      year: 2026,
      status: "OPEN",
      deadline: new Date(Date.now() + 86400000), // +1 day default
      quotas: { create: [{ sport, maxStarters: 5, maxSubstitutes: 2 }] },
      ...overrides,
    },
  });
  competitionIds.push(c.id);
  state();
  return { c, sport };
}

// Mandatory document URLs (fake but non-empty)
let docs = {
  photoFileUrl: "https://example.test/photo.pdf",
  idCardFileUrl: "https://example.test/id.pdf",
  studentCardFileUrl: "https://example.test/card.pdf",
  studentCertFileUrl: "https://example.test/cert.pdf",
  upAcademyFileUrl: "https://example.test/academy.pdf",
  fitnessTestFileUrl: "https://example.test/fitness.pdf",
};

test(
  "Competition status gate — POST /api/applications",
  { timeout: 900000 },
  async (t) => {
    let failed = false;
    async function step(name, fn) {
      let ok = false;
      await t.test(name, async () => {
        await fn();
        ok = true;
        log.push({ name, status: "PASS" });
      });
      if (!ok) {
        failed = true;
        log.push({ name, status: "FAIL" });
        throw new Error("Stopped after failed step: " + name);
      }
    }

    try {
      // Set up one athlete shared across steps
      const athlete = await makeAthlete(1);
      const cookie = await login(athlete.studentId);
      for (const field of Object.keys(docs)) {
        const form = new FormData(); form.set("file", new Blob(["%PDF-1.4\nfixture\n%%EOF"], { type: "application/pdf" }), "fixture.pdf");
        const { json } = await call("/api/documents", cookie, form);
        documentIds.push(json.document.id); docs[field] = "/api/documents/" + json.document.id + "/download";
      }

      // ─── Step 1: OPEN + future deadline → 201 ───────────────────────────
      await step("OPEN competition with future deadline accepts application (201)", async () => {
        const { c, sport } = await makeCompetition();
        // Verify competition is genuinely OPEN with future deadline
        assert.equal(c.status, "OPEN");
        assert.ok(c.deadline > new Date());

        const { json } = await call(
          "/api/applications",
          cookie,
          {
            studentId: athlete.studentId,
            competitionId: c.id,
            sport,
            category: "ทั่วไป",
            ...docs,
          },
          "POST",
          201
        );

        // DB: application created with SUBMITTED status
        const app = await prisma.application.findFirst({
          where: { competitionId: c.id, userId: athlete.id },
          include: { statusHistory: true },
        });
        assert.ok(app, "Application record must exist in DB");
        assert.equal(app.status, "SUBMITTED", "Application status must be SUBMITTED");
        assert.ok(
          app.statusHistory.length >= 1,
          "StatusHistory must have at least one entry"
        );
        assert.ok(
          app.statusHistory.some((h) => h.status === "SUBMITTED"),
          "StatusHistory must contain SUBMITTED entry"
        );
        assert.equal(
          json.application.id,
          app.id,
          "Response application.id matches DB"
        );
      });

      // ─── Step 2: OPEN + expired deadline → 400 ──────────────────────────
      await step("OPEN competition with expired deadline rejects application (400)", async () => {
        const { c, sport } = await makeCompetition();
        // Set deadline to past
        await prisma.competition.update({
          where: { id: c.id },
          data: { deadline: new Date(Date.now() - 86400000) }, // -1 day
        });

        const { json } = await call(
          "/api/applications",
          cookie,
          {
            studentId: athlete.studentId,
            competitionId: c.id,
            sport,
            category: "ทั่วไป",
            ...docs,
          },
          "POST",
          400
        );
        assert.ok(json.error, "Response must contain error field");

        // DB: no application created
        const count = await prisma.application.count({
          where: { competitionId: c.id },
        });
        assert.equal(count, 0, "No application must be created for expired deadline");

        // DB: no statusHistory created
        const historyCount = await prisma.statusHistory.count({
          where: { application: { competitionId: c.id } },
        });
        assert.equal(historyCount, 0, "No statusHistory must exist for rejected request");
      });

      // ─── Step 3: CLOSED + future deadline → 400 ─────────────────────────
      await step("CLOSED competition with future deadline rejects application (400)", async () => {
        const { c, sport } = await makeCompetition();
        // Change status to CLOSED
        await prisma.competition.update({
          where: { id: c.id },
          data: { status: "CLOSED" },
        });

        const { json } = await call(
          "/api/applications",
          cookie,
          {
            studentId: athlete.studentId,
            competitionId: c.id,
            sport,
            category: "ทั่วไป",
            ...docs,
          },
          "POST",
          400
        );
        assert.equal(
          json.error,
          "รายการแข่งขันนี้ไม่เปิดรับสมัคร",
          "Error message must match spec"
        );

        // DB: no application created
        const count = await prisma.application.count({
          where: { competitionId: c.id },
        });
        assert.equal(count, 0, "No application must be created for CLOSED competition");

        const historyCount = await prisma.statusHistory.count({
          where: { application: { competitionId: c.id } },
        });
        assert.equal(historyCount, 0, "No statusHistory must exist for rejected request");
      });

      // ─── Step 4: COMPLETED + future deadline → 400 ──────────────────────
      await step("COMPLETED competition rejects application (400)", async () => {
        const { c, sport } = await makeCompetition();
        // Change status to COMPLETED
        await prisma.competition.update({
          where: { id: c.id },
          data: { status: "COMPLETED" },
        });

        const { json } = await call(
          "/api/applications",
          cookie,
          {
            studentId: athlete.studentId,
            competitionId: c.id,
            sport,
            category: "ทั่วไป",
            ...docs,
          },
          "POST",
          400
        );
        assert.equal(
          json.error,
          "รายการแข่งขันนี้ไม่เปิดรับสมัคร",
          "Error message must match spec"
        );

        // DB: no application created
        const count = await prisma.application.count({
          where: { competitionId: c.id },
        });
        assert.equal(count, 0, "No application must be created for COMPLETED competition");

        const historyCount = await prisma.statusHistory.count({
          where: { application: { competitionId: c.id } },
        });
        assert.equal(historyCount, 0, "No statusHistory must exist for rejected request");
      });

      // ─── Step 5: OPEN + null deadline → 201 ─────────────────────────────
      await step("OPEN competition with null deadline accepts application (201)", async () => {
        const { c, sport } = await makeCompetition({ deadline: null });
        assert.equal(c.status, "OPEN");
        assert.equal(c.deadline, null);

        const { json } = await call(
          "/api/applications",
          cookie,
          {
            studentId: athlete.studentId,
            competitionId: c.id,
            sport,
            category: "ทั่วไป",
            ...docs,
          },
          "POST",
          201
        );

        const app = await prisma.application.findFirst({
          where: { competitionId: c.id, userId: athlete.id },
          include: { statusHistory: true },
        });
        assert.ok(app, "Application record must exist in DB");
        assert.equal(app.status, "SUBMITTED", "Application status must be SUBMITTED");
        assert.ok(app.statusHistory.length >= 1, "StatusHistory must have at least one entry");
        assert.ok(app.statusHistory.some((h) => h.status === "SUBMITTED"), "StatusHistory must contain SUBMITTED entry");
        assert.equal(json.application.id, app.id, "Response application.id matches DB");
      });

      // ─── Step 6: COMPLETED + null deadline → 400 ────────────────────────
      await step("COMPLETED competition with null deadline rejects application (400)", async () => {
        const { c, sport } = await makeCompetition({ status: "COMPLETED", deadline: null });

        const { json } = await call(
          "/api/applications",
          cookie,
          {
            studentId: athlete.studentId,
            competitionId: c.id,
            sport,
            category: "ทั่วไป",
            ...docs,
          },
          "POST",
          400
        );
        assert.equal(json.error, "รายการแข่งขันนี้ไม่เปิดรับสมัคร", "Error message must match spec");

        const count = await prisma.application.count({ where: { competitionId: c.id } });
        assert.equal(count, 0, "No application must be created for COMPLETED competition");
        const historyCount = await prisma.statusHistory.count({ where: { application: { competitionId: c.id } } });
        assert.equal(historyCount, 0, "No statusHistory must exist for rejected request");
      });
    } catch (e) {
      failed = true;
      throw e;
    } finally {
      try {
        const documents = await prisma.privateDocument.findMany({ where: { id: { in: documentIds } } });
        if (documents.length) {
          const { error } = await storage.storage.from(process.env.PRIVATE_DOCUMENT_BUCKET || "athlete-private").remove(documents.map(d => d.path));
          if (error) throw new Error("Failed to clean test documents");
          await prisma.privateDocument.deleteMany({ where: { id: { in: documentIds } } });
        }
        // Cleanup — only fixtures created this run
        await prisma.$transaction(
          async (tx) => {
            await tx.statusHistory.deleteMany({
              where: { application: { competitionId: { in: competitionIds } } },
            });
            await tx.application.deleteMany({
              where: { competitionId: { in: competitionIds } },
            });
            await tx.sportQuota.deleteMany({
              where: { competitionId: { in: competitionIds } },
            });
            await tx.competition.deleteMany({
              where: { id: { in: competitionIds } },
            });
            await tx.user.deleteMany({ where: { id: { in: userIds } } });
          },
          { timeout: 30000 }
        );
        log.push({ name: "Exact fixture cleanup", status: "PASS" });
        if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
      } catch (e) {
        failed = true;
        log.push({ name: "Fixture cleanup", status: "FAIL" });
        throw e;
      } finally {
        fs.writeFileSync(
          "test-results/competition-status-gate-integration.json",
          JSON.stringify(
            {
              date: new Date().toISOString(),
              status: failed ? "FAIL" : "PASS",
              checks: log,
            },
            null,
            2
          )
        );
        await prisma.$disconnect();
      }
    }
  }
);
