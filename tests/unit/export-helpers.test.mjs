import assert from "node:assert/strict";
import test from "node:test";
import {
  exportTeamSheetToCSV,
  exportStartListToCSV,
} from "../../lib/export-helpers.ts";

test("exportTeamSheetToCSV generates structured CSV without error", () => {
  let createdElement = null;
  globalThis.document = {
    createElement: (tag) => {
      createdElement = { tag, href: "", download: "", click: () => {} };
      return createdElement;
    },
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  };

  exportTeamSheetToCSV("TeamSheet_ฟุตบอล_ชมรมฟุตบอล", {
    competitionName: "กีฬามหาวิทยาลัย ครั้งที่ 52",
    clubName: "ชมรมฟุตบอล มหาวิทยาลัยพะเยา",
    sportName: "ฟุตบอล",
    presidentName: "สมชาย รักกีฬา",
    starters: [
      {
        index: 1,
        studentId: "65012345",
        fullName: "สมศักดิ์ แข็งแรง",
        faculty: "วิศวกรรมศาสตร์",
        major: "วิศวกรรมคอมพิวเตอร์",
        category: "ทีมชาย",
        division: "ทั่วไป",
      },
    ],
    substitutes: [
      {
        index: 1,
        studentId: "65012346",
        fullName: "สมเกียรติ ว่องไว",
        faculty: "เทคโนโลยีสารสนเทศ",
        major: "วิทยาการคอมพิวเตอร์",
        category: "ทีมชาย",
        division: "ทั่วไป",
      },
    ],
  });

  assert.ok(createdElement);
  assert.equal(createdElement.download, "TeamSheet_ฟุตบอล_ชมรมฟุตบอล.csv");
});

test("exportStartListToCSV generates event-grouped start list CSV without error", () => {
  let createdElement = null;
  globalThis.document = {
    createElement: (tag) => {
      createdElement = { tag, href: "", download: "", click: () => {} };
      return createdElement;
    },
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  };

  exportStartListToCSV("StartList_กรีฑา_ชมรมกรีฑา", {
    competitionName: "กีฬามหาวิทยาลัย ครั้งที่ 52",
    sportName: "กรีฑา",
    clubName: "ชมรมกรีฑา",
    events: [
      {
        category: "วิ่ง 100 เมตร",
        division: "ชายทั่วไป",
        entries: [
          {
            index: 1,
            studentId: "65012345",
            fullName: "สมศักดิ์ ลมกรด",
            faculty: "วิศวกรรมศาสตร์",
            major: "วิศวกรรมเครื่องกล",
          },
        ],
      },
    ],
  });

  assert.ok(createdElement);
  assert.equal(createdElement.download, "StartList_กรีฑา_ชมรมกรีฑา.csv");
});
