import fs from "node:fs";
import { createHash } from "node:crypto";
import XLSX from "xlsx";

const result = { timestamp: new Date().toISOString(), source: "downloaded-workbook", passed: false };
try {
  if (!process.argv[2]) throw new Error("Input path required");
  const bytes = fs.readFileSync(process.argv[2]);
  const workbook = XLSX.read(bytes, { type: "buffer" });
  const sheet = workbook.Sheets.Applicants;
  const rows = sheet ? XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) : [];
  const expected = ["รหัสใบสมัคร", "รหัสนิสิต", "ชื่อ", "นามสกุล", "คณะ", "สาขาวิชา", "เบอร์โทรศัพท์", "การแข่งขัน", "ชนิดกีฬา", "ประเภท", "สถานะ", "วันที่สมัคร"];
  result.sha256 = createHash("sha256").update(bytes).digest("hex");
  result.headers = rows[0] ?? [];
  result.rowCount = Math.max(0, rows.length - 1);
  result.matchesCurrentColumns = JSON.stringify(result.headers) === JSON.stringify(expected);
  // This command checks structure only. Comparing filters/values requires independent expected data.
  result.filterContentsVerified = false;
  result.passed = result.matchesCurrentColumns && result.rowCount > 0;
} catch {
  result.error = "Could not inspect workbook; check input path and file format";
}
fs.writeFileSync("test-results/xlsx-download-verification.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
