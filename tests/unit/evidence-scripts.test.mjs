import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import XLSX from "xlsx";

test("download inspection rejects old columns and accepts current columns without changing input", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xlsx-evidence-"));
  const script = path.resolve("scripts/inspect-downloaded-xlsx.mjs");
  fs.mkdirSync(path.join(dir, "test-results"));
  try {
    for (const headers of [["การแข่งขัน", "รหัสนิสิต", "ชื่อ", "กีฬา", "สถานะ"], ["รหัสใบสมัคร", "รหัสนิสิต", "ชื่อ", "นามสกุล", "คณะ", "สาขาวิชา", "เบอร์โทรศัพท์", "การแข่งขัน", "ชนิดกีฬา", "ประเภท", "สถานะ", "วันที่สมัคร"]]) {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([headers, headers.map(() => "ทดสอบ")]), "Applicants");
      const file = path.join(dir, "download.xlsx");
      XLSX.writeFile(workbook, file);
      const before = fs.readFileSync(file);
      const run = spawnSync(process.execPath, [script, file], { cwd: dir });
      assert.equal(run.status, headers.length === 12 ? 0 : 1);
      assert.deepEqual(fs.readFileSync(file), before);
      const evidence = JSON.parse(fs.readFileSync(path.join(dir, "test-results/xlsx-download-verification.json")));
      assert.equal(evidence.filterContentsVerified, false);
    }
    assert.equal(spawnSync(process.execPath, [script, "missing.xlsx"], { cwd: dir }).status, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
