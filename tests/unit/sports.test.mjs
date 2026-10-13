import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSportName, DEFAULT_SPORTS } from "../../lib/sports.ts";

test("normalizeSportName strips extra spaces and normalizes unicode", () => {
  assert.equal(normalizeSportName("  ฟุตบอล  "), "ฟุตบอล");
  assert.equal(normalizeSportName("เทเบิล   เทนนิส"), "เทเบิล เทนนิส");
});

test("allows new custom sport names after normalization", () => {
  assert.equal(normalizeSportName("  รักบี้ 7 คน  "), "รักบี้ 7 คน");
});

test("default sports list provides seed values", () => {
  assert.ok(DEFAULT_SPORTS.includes("ฟุตบอล"));
  assert.ok(DEFAULT_SPORTS.includes("หมากรุก"));
});
