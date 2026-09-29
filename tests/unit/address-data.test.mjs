import assert from "node:assert/strict";
import test from "node:test";

import {
  ALL_THAI_PROVINCES,
  getAmphuresByProvince,
  getTambonsByAmphure,
} from "../../lib/thailand-addresses.ts";

test("Thai address data cascades from province to postal code", () => {
  assert.equal(ALL_THAI_PROVINCES.length, 77);
  assert.ok(ALL_THAI_PROVINCES.includes("พะเยา"));

  const amphures = getAmphuresByProvince("พะเยา");
  assert.ok(amphures.some((amphure) => amphure.name === "เมืองพะเยา"));

  const tambons = getTambonsByAmphure("พะเยา", "เมืองพะเยา");
  assert.deepEqual(
    tambons.find((tambon) => tambon.name === "เวียง"),
    { name: "เวียง", postalCode: "56000" },
  );
});

test("Thai address helpers fail closed for incomplete or unknown selections", () => {
  assert.deepEqual(getAmphuresByProvince(""), []);
  assert.deepEqual(getAmphuresByProvince("ไม่ใช่จังหวัด"), []);
  assert.deepEqual(getTambonsByAmphure("พะเยา", ""), []);
  assert.deepEqual(getTambonsByAmphure("พะเยา", "ไม่ใช่อำเภอ"), []);
});
