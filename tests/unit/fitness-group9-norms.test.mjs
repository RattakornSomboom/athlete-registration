import assert from "node:assert/strict";
import test from "node:test";
import {
  Group9ValidationError,
  evaluateGroup9Fitness,
  rateGroup9Value,
  toBodyWeightRatio,
} from "../../lib/fitness-group9-norms.ts";

test("group 9 male boundaries (lower is better)", () => {
  assert.equal(rateGroup9Value("ชาย", "sprint40mSec", 5.46), "ดีมาก");
  assert.equal(rateGroup9Value("ชาย", "sprint40mSec", 5.47), "ดี");
  assert.equal(rateGroup9Value("ชาย", "sprint40mSec", 6.59), "ต่ำ");
  assert.equal(rateGroup9Value("ชาย", "sprint40mSec", 6.6), "ต่ำมาก");
  assert.equal(rateGroup9Value("ชาย", "bodyFatPercent", 9.2), "ดีมาก");
  assert.equal(rateGroup9Value("ชาย", "bodyFatPercent", 9.3), "ดี");
  assert.equal(rateGroup9Value("ชาย", "bodyFatPercent", 18.9), "ต่ำมาก");
});

test("group 9 male boundaries (higher is better)", () => {
  assert.equal(rateGroup9Value("ชาย", "sitUps1Min", 61), "ดีมาก");
  assert.equal(rateGroup9Value("ชาย", "sitUps1Min", 60), "ดี");
  assert.equal(rateGroup9Value("ชาย", "sitUps1Min", 39), "ต่ำมาก");
  assert.equal(rateGroup9Value("ชาย", "vo2maxMlKgMin", 47.1), "ดี");
  assert.equal(rateGroup9Value("ชาย", "vo2maxMlKgMin", 36.3), "ต่ำมาก");
});

test("group 9 female boundaries", () => {
  assert.equal(rateGroup9Value("หญิง", "legStrengthRatio", 3.14), "ดีมาก");
  assert.equal(rateGroup9Value("หญิง", "legStrengthRatio", 3.13), "ดี");
  assert.equal(rateGroup9Value("หญิง", "sprint40mSec", 6.2), "ดีมาก");
  assert.equal(rateGroup9Value("หญิง", "sprint40mSec", 8.14), "ต่ำมาก");
  assert.equal(rateGroup9Value("หญิง", "pushUps1Min", 25), "ต่ำมาก");
});

test("evaluateGroup9Fitness aggregates and reports missing tests", () => {
  const result = evaluateGroup9Fitness({ sprint40mSec: 5.4, vo2maxMlKgMin: 54, sitUps1Min: 45 }, "ชาย");
  assert.equal(result.items.length, 3);
  assert.equal(result.missing.length, 8);
  assert.equal(result.totalScore, 5 + 5 + 2);
  assert.equal(result.passed, false);
  assert.equal(result.overallRating, "ดี");
});

test("evaluateGroup9Fitness rejects empty and out-of-range input", () => {
  assert.throws(() => evaluateGroup9Fitness({}, "ชาย"), Group9ValidationError);
  assert.throws(() => evaluateGroup9Fitness({ sprint40mSec: 1 }, "หญิง"), Group9ValidationError);
  assert.throws(() => evaluateGroup9Fitness({ sitUps1Min: Number.NaN }, "ชาย"), Group9ValidationError);
});

test("toBodyWeightRatio converts force to ratio", () => {
  assert.equal(toBodyWeightRatio(50, 60), 0.83);
  assert.throws(() => toBodyWeightRatio(50, 0), Group9ValidationError);
});