import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_EXCELLENCE_SPORT, EXCELLENCE_SPORTS, findExcellenceSport } from "../../lib/excellence-sports.ts";
import { EXCELLENCE_SPORT } from "../../lib/excellence-athletics.ts";

test("sport registry resolves registered sports and rejects anything else", () => {
  assert.equal(findExcellenceSport("กรีฑา")?.label, "กรีฑา");
  assert.equal(findExcellenceSport("ว่ายน้ำ"), null);
  assert.equal(findExcellenceSport(undefined), null);
  assert.equal(findExcellenceSport(42), null);
  assert.equal(DEFAULT_EXCELLENCE_SPORT, EXCELLENCE_SPORTS[0].key);
});

test("the athletics data layer matches the registered sport key", () => {
  assert.ok(findExcellenceSport(EXCELLENCE_SPORT));
});
