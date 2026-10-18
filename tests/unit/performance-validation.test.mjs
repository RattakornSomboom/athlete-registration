import assert from "node:assert/strict";
import test from "node:test";
import {
  validateActionPlanInput,
  validateBenchmarkInput,
  validateFollowUpRetestInput,
  validateMatchResultInput,
} from "../../lib/performance-validation.ts";
import { preserveExcellenceMetadata } from "../../lib/fitness-score-metadata.ts";

test("accepts valid match result payload", () => {
  const result = validateMatchResultInput({
    applicationId: "app-123",
    score: 85.5,
    rank: 1,
    resultOutcome: "win",
    notes: "ทำคะแนนได้ดี",
  });

  assert.equal(result.applicationId, "app-123");
  assert.equal(result.score, 85.5);
  assert.equal(result.rank, 1);
  assert.equal(result.resultOutcome, "WIN");
  assert.equal(result.isWinner, true);
  assert.equal(result.notes, "ทำคะแนนได้ดี");
});

test("strips dangerous tags and sanitizes XSS inputs", () => {
  const result = validateMatchResultInput({
    applicationId: "app-123",
    notes: "<script>alert('xss')</script>ความเห็นปกติ",
    staffNotes: "javascript:void(0) ผ่านเกณฑ์",
  });

  assert.equal(result.notes, "scriptalert('xss')/scriptความเห็นปกติ");
  assert.equal(result.staffNotes, "void(0) ผ่านเกณฑ์");
});

test("rejects negative score or invalid rank", () => {
  assert.throws(
    () => validateMatchResultInput({ applicationId: "app-1", score: -5 }),
    /คะแนนต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0/,
  );

  assert.throws(
    () => validateMatchResultInput({ applicationId: "app-1", rank: 0 }),
    /อันดับต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป/,
  );

  assert.throws(
    () => validateMatchResultInput({ applicationId: "app-1", rank: 2.5 }),
    /อันดับต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป/,
  );
});

test("rejects invalid outcome and empty application id", () => {
  assert.throws(
    () => validateMatchResultInput({ applicationId: "   " }),
    /กรุณาระบุ applicationId/,
  );

  assert.throws(
    () => validateMatchResultInput({ applicationId: "app-1", resultOutcome: "UNKNOWN" }),
    /ผลการแข่งขันต้องเป็น WIN, LOSS, DRAW, PODIUM, DNF หรือ DQ/,
  );
});

test("validates athlete action plan input", () => {
  const valid = validateActionPlanInput({
    applicationId: "app-1",
    coachName: "โค้ช สมศักดิ์",
    responsiblePerson: "ผู้ดูแลชมรม",
    startDate: "2026-10-16",
    endDate: "2026-11-16",
    items: ["Plyometrics 3 ครั้ง/สัปดาห์", "Sprint 40m"],
    status: "IN_PROGRESS",
    notes: "เน้นการระเบิดพลัง",
  });
  assert.equal(valid.coachName, "โค้ช สมศักดิ์");
  assert.equal(valid.status, "IN_PROGRESS");
  assert.equal(valid.items.length, 2);

  assert.throws(
    () => validateActionPlanInput({ applicationId: "app-1", coachName: "", responsiblePerson: "ผู้ดูแล", startDate: "2026-10-16", endDate: "2026-11-16", items: ["ซ้อม"] }),
    /กรุณาระบุชื่อโค้ช/,
  );

  assert.throws(
    () => validateActionPlanInput({ applicationId: "app-1", coachName: "โค้ช", responsiblePerson: "ผู้ดูแล", startDate: "2026-11-16", endDate: "2026-10-16", items: ["ซ้อม"] }),
    /วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มแผน/,
  );
});

test("validates follow-up retest input and ratings", () => {
  const valid = validateFollowUpRetestInput({
    applicationId: "app-1",
    testedAt: "2026-10-20T00:00:00.000Z",
    totalScore: 82,
    timeSeconds: 5.25,
    ratings: {
      "ความเร็วสปีด (40m Sprint)": "ดีมาก",
      "แรงระเบิดกล้ามเนื้อ (Leg Power)": "ดี",
    },
    notes: "ออกตัวดีขึ้น",
  });
  assert.equal(valid.totalScore, 82);
  assert.equal(valid.timeSeconds, 5.25);
  assert.equal(valid.ratings["ความเร็วสปีด (40m Sprint)"], "ดีมาก");

  assert.throws(
    () => validateFollowUpRetestInput({ applicationId: "app-1", testedAt: "invalid", ratings: {} }),
    /วันที่ทดสอบซ้ำไม่ถูกต้อง/,
  );
});

test("validates sport benchmark inputs", () => {
  const valid = validateBenchmarkInput({
    sport: "กรีฑา",
    targetTimeSeconds: 5.15,
    targetScore: 88,
  });
  assert.equal(valid.sport, "กรีฑา");
  assert.equal(valid.targetTimeSeconds, 5.15);
  assert.equal(valid.targetScore, 88);

  assert.throws(
    () => validateBenchmarkInput({ sport: "", targetTimeSeconds: 5.15, targetScore: 88 }),
    /กรุณาระบุชื่อกีฬา/,
  );

  assert.throws(
    () => validateBenchmarkInput({ sport: "บาสเกตบอล", targetTimeSeconds: 5.15, targetScore: 88 }),
    /โมดูลสู่ความเป็นเลิศรองรับเฉพาะชนิดกีฬานำร่อง/,
  );

  const waterSport = validateBenchmarkInput({
    sport: "กีฬาทางน้ำ",
    targetTimeSeconds: 27.2,
    targetScore: 85,
  });
  assert.equal(waterSport.sport, "กีฬาทางน้ำ");
  assert.equal(waterSport.targetTimeSeconds, 27.2);
});

test("preserves closed-loop metadata when baseline scores are imported again", () => {
  const result = preserveExcellenceMetadata(
    { items: { speed: "ดี" }, _excellence: { retests: [{ id: "retest-1" }] } },
    { items: { speed: "ดีมาก" }, passPercentage: 90 },
  );
  assert.deepEqual(result, {
    items: { speed: "ดีมาก" },
    passPercentage: 90,
    _excellence: { retests: [{ id: "retest-1" }] },
  });
});
