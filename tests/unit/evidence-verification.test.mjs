import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEvidenceLabel,
  encodeEvidenceStatus,
  evaluateResultRecency,
  isEvidenceHistory,
  hasVerifiedResults,
  parseEvidenceStatus,
  REQUIRED_EVIDENCE_ITEMS,
  summarizeEvidence,
} from "../../lib/evidence-verification.ts";

test("evidence status encodes and parses round trip", () => {
  const status = encodeEvidenceStatus("GPAX", "ACTION_REQUIRED");
  assert.deepEqual(parseEvidenceStatus(status), { item: "GPAX", result: "ACTION_REQUIRED" });
  assert.equal(isEvidenceHistory("SUBMITTED"), false);
  assert.equal(parseEvidenceStatus("EVIDENCE:GPAX:MAYBE"), null);
});

test("summary keeps the latest result per item and defaults to PENDING", () => {
  const rows = [
    { id: "1", status: encodeEvidenceStatus("GPAX", "REJECTED"), label: "x", by: "u1", createdAt: "2026-01-01T00:00:00Z" },
    { id: "2", status: encodeEvidenceStatus("GPAX", "PASSED"), label: "y", by: "u2", createdAt: "2026-01-02T00:00:00Z" },
    { id: "3", status: "SUBMITTED", label: "z", by: "u3", createdAt: "2026-01-03T00:00:00Z" },
  ];
  const summary = summarizeEvidence(rows);
  assert.equal(summary.GPAX.result, "PASSED");
  assert.equal(summary.GPAX.by, "u2");
  assert.equal(summary.FITNESS_TEST.result, "PENDING");
});

test("required evidence items temporarily exclude fitness test", () => {
  assert.equal(REQUIRED_EVIDENCE_ITEMS.includes("FITNESS_TEST"), false);
  assert.deepEqual(REQUIRED_EVIDENCE_ITEMS, ["STUDENT_STATUS", "GPAX", "COMPETITION_HISTORY"]);
});

test("label includes reason and reference", () => {
  const label = buildEvidenceLabel("STUDENT_STATUS", "REJECTED", "บัตรไม่ชัด", "ไฟล์ที่ 2");
  assert.match(label, /ไม่ผ่าน — บัตรไม่ชัด \(อ้างอิง: ไฟล์ที่ 2\)/);
});

test("result recency uses a 2 year window and normalizes B.E. years", () => {
  assert.equal(evaluateResultRecency([{ year: "2567" }], 2026).passed, true);
  assert.equal(evaluateResultRecency([{ year: "2567" }], 2569).passed, true);
  assert.equal(evaluateResultRecency([{ year: "2566" }], 2569).passed, false);
  assert.equal(evaluateResultRecency([], 2026).passed, null);
});

test("hasVerifiedResults accepts pending competition history if results are recent", () => {
  const appPassed = {
    competitionResults: [{ year: "2567" }],
    competition: { year: 2026 },
    statusHistory: [],
  };
  assert.equal(hasVerifiedResults(appPassed), true);

  const appOld = {
    competitionResults: [{ year: "2560" }],
    competition: { year: 2026 },
    statusHistory: [],
  };
  assert.equal(hasVerifiedResults(appOld), false);

  const appEmpty = {
    competitionResults: [],
    competition: { year: 2026 },
    statusHistory: [],
  };
  assert.equal(hasVerifiedResults(appEmpty), false);
});
