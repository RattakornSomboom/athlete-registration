import assert from "node:assert/strict";
import test from "node:test";
import {
  combatDivisions,
  combatDivisionsFemale,
  combatDivisionsMale,
  filterCategoriesByGender,
  filterDivisionsByGender,
  getSportConfig,
  SPORT_CATEGORIES,
} from "../../lib/sports-categories.ts";

test("filterCategoriesByGender keeps only male and open/mixed categories for male athletes", () => {
  // เซปักตะกร้อ
  const takrawCats = SPORT_CATEGORIES["เซปักตะกร้อ"].categories;
  const maleTakraw = filterCategoriesByGender(takrawCats, "male");
  assert.deepEqual(maleTakraw, ["ทีมชุด (ชาย)", "ทีมเดี่ยว (ชาย)", "ตะกร้อคู่ (ชาย)"]);

  // เปตอง (has mixed categories)
  const petanqueCats = SPORT_CATEGORIES["เปตอง"].categories;
  const malePetanque = filterCategoriesByGender(petanqueCats, "ชาย");
  assert.deepEqual(malePetanque, ["ชายเดี่ยว", "ชายคู่", "คู่ผสม", "ทีมชาย (3 คน)"]);

  // กีฬาทางน้ำ
  const swimCats = SPORT_CATEGORIES["กีฬาทางน้ำ"].categories;
  const maleSwim = filterCategoriesByGender(swimCats, "male");
  assert.deepEqual(maleSwim, ["บุคคลชาย", "ผลัดชาย", "ผลัดผสม"]);

  // เทควันโด (has neutral poomsae categories)
  const tkdCats = SPORT_CATEGORIES["เทควันโด"].categories;
  const maleTkd = filterCategoriesByGender(tkdCats, "male");
  assert.deepEqual(maleTkd, ["ต่อสู้ (ชาย)", "พุ่มเซ่ (เดี่ยว)", "พุ่มเซ่ (คู่)", "พุ่มเซ่ (ทีม)"]);

  // อีสปอร์ต (all neutral)
  const esportCats = SPORT_CATEGORIES["อีสปอร์ต"].categories;
  const maleEsport = filterCategoriesByGender(esportCats, "male");
  assert.deepEqual(maleEsport, ["บุคคล", "ทีม"]);
});

test("filterCategoriesByGender keeps only female and open/mixed categories for female athletes", () => {
  // เซปักตะกร้อ
  const takrawCats = SPORT_CATEGORIES["เซปักตะกร้อ"].categories;
  const femaleTakraw = filterCategoriesByGender(takrawCats, "female");
  assert.deepEqual(femaleTakraw, ["ทีมชุด (หญิง)", "ทีมเดี่ยว (หญิง)", "ตะกร้อคู่ (หญิง)"]);

  // เปตอง
  const petanqueCats = SPORT_CATEGORIES["เปตอง"].categories;
  const femalePetanque = filterCategoriesByGender(petanqueCats, "หญิง");
  assert.deepEqual(femalePetanque, ["หญิงเดี่ยว", "หญิงคู่", "คู่ผสม", "ทีมหญิง (3 คน)"]);

  // วอลเลย์บอล
  const vbCats = SPORT_CATEGORIES["วอลเลย์บอล"].categories;
  const femaleVb = filterCategoriesByGender(vbCats, "female");
  assert.deepEqual(femaleVb, ["ทีมหญิง"]);

  // เทควันโด
  const tkdCats = SPORT_CATEGORIES["เทควันโด"].categories;
  const femaleTkd = filterCategoriesByGender(tkdCats, "female");
  assert.deepEqual(femaleTkd, ["ต่อสู้ (หญิง)", "พุ่มเซ่ (เดี่ยว)", "พุ่มเซ่ (คู่)", "พุ่มเซ่ (ทีม)"]);
});

test("filterCategoriesByGender returns all categories when gender is unspecified", () => {
  const takrawCats = SPORT_CATEGORIES["เซปักตะกร้อ"].categories;
  assert.deepEqual(filterCategoriesByGender(takrawCats, ""), takrawCats);
  assert.deepEqual(filterCategoriesByGender(takrawCats, null), takrawCats);
  assert.deepEqual(filterCategoriesByGender(takrawCats, undefined), takrawCats);
});

test("filterDivisionsByGender filters combat weight divisions by gender", () => {
  assert.deepEqual(filterDivisionsByGender(combatDivisions, "male"), combatDivisionsMale);
  assert.deepEqual(filterDivisionsByGender(combatDivisions, "female"), combatDivisionsFemale);
  assert.deepEqual(filterDivisionsByGender(combatDivisions, ""), combatDivisions);
});

test("filterDivisionsByGender preserves general and non-combat divisions", () => {
  const general = ["ทั่วไป"];
  assert.deepEqual(filterDivisionsByGender(general, "male"), ["ทั่วไป"]);
  assert.deepEqual(filterDivisionsByGender(general, "female"), ["ทั่วไป"]);

  const swimDivs = SPORT_CATEGORIES["กีฬาทางน้ำ"].divisions;
  assert.deepEqual(filterDivisionsByGender(swimDivs, "male"), swimDivs);
  assert.deepEqual(filterDivisionsByGender(swimDivs, "female"), swimDivs);
});

test("getSportConfig applies gender filtering to both categories and divisions", () => {
  // Male takraw
  const configMaleTakraw = getSportConfig("เซปักตะกร้อ", "male");
  assert.deepEqual(configMaleTakraw.categories, ["ทีมชุด (ชาย)", "ทีมเดี่ยว (ชาย)", "ตะกร้อคู่ (ชาย)"]);
  assert.deepEqual(configMaleTakraw.divisions, ["ทั่วไป"]);

  // Female takraw
  const configFemaleTakraw = getSportConfig("เซปักตะกร้อ", "female");
  assert.deepEqual(configFemaleTakraw.categories, ["ทีมชุด (หญิง)", "ทีมเดี่ยว (หญิง)", "ตะกร้อคู่ (หญิง)"]);
  assert.deepEqual(configFemaleTakraw.divisions, ["ทั่วไป"]);

  // Male taekwondo (combat sport)
  const configMaleTkd = getSportConfig("เทควันโด", "male");
  assert.deepEqual(configMaleTkd.categories, ["ต่อสู้ (ชาย)", "พุ่มเซ่ (เดี่ยว)", "พุ่มเซ่ (คู่)", "พุ่มเซ่ (ทีม)"]);
  assert.deepEqual(configMaleTkd.divisions, combatDivisionsMale);

  // Female taekwondo (combat sport)
  const configFemaleTkd = getSportConfig("เทควันโด", "female");
  assert.deepEqual(configFemaleTkd.categories, ["ต่อสู้ (หญิง)", "พุ่มเซ่ (เดี่ยว)", "พุ่มเซ่ (คู่)", "พุ่มเซ่ (ทีม)"]);
  assert.deepEqual(configFemaleTkd.divisions, combatDivisionsFemale);

  // Fallback sport without gender
  const configNoGender = getSportConfig("เซปักตะกร้อ");
  assert.deepEqual(configNoGender.categories, SPORT_CATEGORIES["เซปักตะกร้อ"].categories);
});
