import assert from "node:assert/strict";
import test from "node:test";
import {
  UNIVERSITY_CLUBS,
  encodeClubNote,
  extractClubFromNote,
  suggestClubForSport,
} from "../../lib/university-clubs.ts";

test("university clubs list has exactly 14 official sports clubs", () => {
  assert.equal(UNIVERSITY_CLUBS.length, 14);
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมแบดมินตัน มหาวิทยาลัยพะเยา"));
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมฟุตซอล มหาวิทยาลัยพะเยา"));
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมวอลเลย์บอล"));
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมบาสเกตบอล"));
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมฟุตบอล มหาวิทยาลัยพะเยา"));
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมเปตอง มหาวิทยาลัยพะเยา"));
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมชมรมเทควันโดมหาวิทยาลัยพะเยา TKD UP"));
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมมวยมหาวิทยาลัยพะเยา"));
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมปิงปองมหาวิทยาลัยพะเยา"));
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมวู้ดบอล มหาวิทยาลัยพะเยา"));
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมวิ่ง ว่าย พาย ปั่น"));
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมผู้นำเชียร์มหาวิทยาลัยพะเยา"));
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมฟิตเนสและแอโรบิค"));
  assert.ok(UNIVERSITY_CLUBS.includes("ชมรมผู้ตัดสิน มหาวิทยาลัยพะเยา"));
});

test("encodeClubNote and extractClubFromNote work round-trip cleanly", () => {
  const encoded = encodeClubNote("ต้องการสมัครตำแหน่งกองหน้า", "ชมรมฟุตบอล มหาวิทยาลัยพะเยา");
  assert.match(encoded, /^\[สังกัดชมรม: ชมรมฟุตบอล มหาวิทยาลัยพะเยา\]/);

  const parsed = extractClubFromNote(encoded);
  assert.equal(parsed.clubName, "ชมรมฟุตบอล มหาวิทยาลัยพะเยา");
  assert.equal(parsed.note, "ต้องการสมัครตำแหน่งกองหน้า");
});

test("encodeClubNote handles empty notes and clubs gracefully", () => {
  assert.equal(encodeClubNote(null, "ชมรมบาสเกตบอล"), "[สังกัดชมรม: ชมรมบาสเกตบอล]");
  assert.equal(encodeClubNote("หมายเหตุทดสอบ", null), "หมายเหตุทดสอบ");
  assert.equal(encodeClubNote(null, null), null);

  const emptyParsed = extractClubFromNote(null);
  assert.equal(emptyParsed.clubName, null);
  assert.equal(emptyParsed.note, null);
});

test("suggestClubForSport matches representative sports correctly", () => {
  assert.equal(suggestClubForSport("ฟุตซอล"), "ชมรมฟุตซอล มหาวิทยาลัยพะเยา");
  assert.equal(suggestClubForSport("บาสเกตบอล 5 คน"), "ชมรมบาสเกตบอล");
  assert.equal(suggestClubForSport("เทเบิลเทนนิส ชายเดี่ยว"), "ชมรมปิงปองมหาวิทยาลัยพะเยา");
  assert.equal(suggestClubForSport("กีฬาที่ไม่มีในสารบบ"), null);
});
