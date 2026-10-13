import assert from "node:assert/strict";
import test from "node:test";
import {
  combineTitleWithFirstName,
  detectAthleteGender,
  genderFromTitle,
  getGenderLabel,
  isNameGender,
  isNameTitle,
  splitTitleFromName,
} from "../../lib/thai-name-title.ts";

test("splitTitleFromName extracts the Thai prefix before the first name", () => {
  assert.deepEqual(splitTitleFromName("นายสมชาย"), { title: "Mr", firstName: "สมชาย", gender: "male" });
  assert.deepEqual(splitTitleFromName("นางสาวสมหญิง"), { title: "Miss", firstName: "สมหญิง", gender: "female" });
  assert.deepEqual(splitTitleFromName("นางมาลี"), { title: "Mrs", firstName: "มาลี", gender: "female" });
});

test("splitTitleFromName matches นางสาว before นาง so Miss is not misread as Mrs", () => {
  const result = splitTitleFromName("นางสาววิภา");
  assert.equal(result.title, "Miss");
  assert.equal(result.firstName, "วิภา");
});

test("splitTitleFromName keeps a name without a known prefix intact", () => {
  assert.deepEqual(splitTitleFromName("วิชัย"), { title: "", firstName: "วิชัย", gender: "" });
  assert.deepEqual(splitTitleFromName("ดร.วิชัย"), { title: "", firstName: "ดร.วิชัย", gender: "" });
  assert.deepEqual(splitTitleFromName(""), { title: "", firstName: "", gender: "" });
});

test("combineTitleWithFirstName joins prefix and name without duplicating the prefix", () => {
  assert.equal(combineTitleWithFirstName("Mr", "สมชาย"), "นายสมชาย");
  assert.equal(combineTitleWithFirstName("Miss", "สมหญิง"), "นางสาวสมหญิง");
  assert.equal(combineTitleWithFirstName("Mrs", "มาลี"), "นางมาลี");
  assert.equal(combineTitleWithFirstName("Mr", "นายสมชาย"), "นายสมชาย");
  assert.equal(combineTitleWithFirstName("", "สมชาย"), "สมชาย");
});

test("combine and split round-trip keeps the stored first name stable", () => {
  for (const fullName of ["นายสมชาย", "นางสาวสมหญิง", "นางมาลี", "วิชัย"]) {
    const parsed = splitTitleFromName(fullName);
    assert.equal(combineTitleWithFirstName(parsed.title, parsed.firstName), fullName);
  }
});

test("genderFromTitle maps titles to the auto-selected gender", () => {
  assert.equal(genderFromTitle("Mr"), "male");
  assert.equal(genderFromTitle("Miss"), "female");
  assert.equal(genderFromTitle("Mrs"), "female");
  assert.equal(genderFromTitle(""), "");
  assert.equal(genderFromTitle("doctor"), "");
});

test("type guards accept only the supported title and gender codes", () => {
  assert.equal(isNameTitle("Mr"), true);
  assert.equal(isNameTitle("นาง"), false);
  assert.equal(isNameGender("male"), true);
  assert.equal(isNameGender("other"), false);
});

test("detectAthleteGender recognizes male and female prefixes", () => {
  assert.equal(detectAthleteGender("นายสมชาย"), "male");
  assert.equal(detectAthleteGender("นางสาวสมหญิง"), "female");
  assert.equal(detectAthleteGender("นางมาลี"), "female");
  assert.equal(detectAthleteGender("น.ส.วิภา"), "female");
  assert.equal(detectAthleteGender("เด็กหญิงสุดา"), "female");
  assert.equal(detectAthleteGender("ด.ญ.สุดา"), "female");
  assert.equal(detectAthleteGender("เด็กชายสมศักดิ์"), "male");
  assert.equal(detectAthleteGender("ด.ช.สมศักดิ์"), "male");
  assert.equal(detectAthleteGender("วิชัย"), "");
  assert.equal(detectAthleteGender(""), "");
});

test("getGenderLabel converts gender codes to Thai labels", () => {
  assert.equal(getGenderLabel("male"), "ชาย");
  assert.equal(getGenderLabel("female"), "หญิง");
  assert.equal(getGenderLabel("ชาย"), "ชาย");
  assert.equal(getGenderLabel("หญิง"), "หญิง");
  assert.equal(getGenderLabel(""), "");
  assert.equal(getGenderLabel(null), "");
  assert.equal(getGenderLabel(undefined), "");
});

