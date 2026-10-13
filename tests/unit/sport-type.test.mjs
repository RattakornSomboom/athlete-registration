import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SPORT_TYPE_BY_NAME,
  getSportEntryLimit,
  getSportType,
  isIndividualSport,
  isSportEntryCountAllowed,
  isTeamSport,
} from "../../lib/sport-type.ts";

test("maps common team and individual sports correctly", () => {
  assert.equal(getSportType("ฟุตบอล"), "TEAM");
  assert.equal(getSportType("บาสเกตบอล"), "TEAM");
  assert.equal(getSportType("อีสปอร์ต"), "TEAM");
  assert.equal(getSportType("กรีฑา"), "INDIVIDUAL");
  assert.equal(getSportType("ว่ายน้ำ"), "INDIVIDUAL");
  assert.equal(getSportType("แบดมินตัน"), "INDIVIDUAL");
});

test("provides default mapping covering all system default sports", () => {
  assert.equal(DEFAULT_SPORT_TYPE_BY_NAME["ฟุตบอล"], "TEAM");
  assert.equal(DEFAULT_SPORT_TYPE_BY_NAME["วอลเลย์บอล"], "TEAM");
  assert.equal(DEFAULT_SPORT_TYPE_BY_NAME["กรีฑา"], "INDIVIDUAL");
});

test("applies entry limits by sport type", () => {
  assert.equal(isTeamSport("ฟุตบอล"), true);
  assert.equal(isIndividualSport("กรีฑา"), true);
  assert.equal(getSportEntryLimit("ฟุตบอล"), 1);
  assert.equal(getSportEntryLimit("กรีฑา"), 4);
});

test("validates entry count constraints for team vs individual sports", () => {
  assert.equal(isSportEntryCountAllowed("ฟุตบอล", 1), true);
  assert.equal(isSportEntryCountAllowed("ฟุตบอล", 2), false);

  assert.equal(isSportEntryCountAllowed("กรีฑา", 1), true);
  assert.equal(isSportEntryCountAllowed("กรีฑา", 4), true);
  assert.equal(isSportEntryCountAllowed("กรีฑา", 5), false);
  assert.equal(isSportEntryCountAllowed("กรีฑา", 0), false);
});

test("supports configured sport type override", () => {
  // Override known sport
  assert.equal(getSportType("ฟุตบอล", "INDIVIDUAL"), "INDIVIDUAL");
  assert.equal(isTeamSport("ฟุตบอล", "INDIVIDUAL"), false);
  assert.equal(isIndividualSport("ฟุตบอล", "INDIVIDUAL"), true);
  assert.equal(getSportEntryLimit("ฟุตบอล", "INDIVIDUAL"), 4);
  assert.equal(isSportEntryCountAllowed("ฟุตบอล", 3, "INDIVIDUAL"), true);

  // Custom sport with configured TEAM
  assert.equal(getSportType("หมากกระดาน", "TEAM"), "TEAM");
  assert.equal(isTeamSport("หมากกระดาน", "TEAM"), true);
  assert.equal(getSportEntryLimit("หมากกระดาน", "TEAM"), 1);
  assert.equal(isSportEntryCountAllowed("หมากกระดาน", 2, "TEAM"), false);
});
