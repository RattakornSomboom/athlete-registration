import "dotenv/config";
import fs from "node:fs";
import XLSX from "xlsx";
import dotenv from "dotenv";

const testEnv = dotenv.parse(fs.readFileSync(".env.release-test", "utf8"));
const apiBase = testEnv.TEST_BASE_URL;
if (!apiBase || testEnv.TEST_ALLOW_WRITE !== "yes" || testEnv.TEST_DATABASE_URL === process.env.DATABASE_URL) {
  throw new Error("Fixture verification requires explicit TEST_ALLOW_WRITE=yes and a separate test database; this is not browser-download evidence");
}
import { statusLabel } from "../lib/phase4-client.ts";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const testDb = new PrismaClient({ adapter: new PrismaPg({ connectionString: testEnv.TEST_DATABASE_URL }) });

async function main() {
  console.log("Starting XLSX workbook verification...");

  // Setup staff and test application fixtures
  const staffEmail = `staff-xlsx-${Date.now()}@example.test`;
  const studentId = "8" + String(Date.now()).slice(-7);
  const password = "XlsxPassword123!";
  const hash = await bcrypt.hash(password, 4);

  const staffUser = await testDb.user.create({
    data: { email: staffEmail, password: hash, role: "STAFF" },
  });

  const athleteUser = await testDb.user.create({
    data: {
      studentId,
      email: `athlete-${studentId}@example.test`,
      password: hash,
      role: "ATHLETE",
      profile: {
        create: {
          firstName: "สมชาย",
          lastName: "ใจดี",
          faculty: "คณะวิทยาศาสตร์",
          major: "วิทยาการคอมพิวเตอร์",
          phone: "0812345678",
          year: "2",
          studentLevel: "BACHELOR",
          nationalId: "1234567890123",
          birthDate: new Date("2005-01-01"),
          addressNo: "1",
          subDistrict: "แม่กา",
          district: "เมือง",
          province: "พะเยา",
          postalCode: "56000",
        },
      },
    },
  });

  const competition = await testDb.competition.create({
    data: {
      name: "การแข่งขันกีฬาประเพณี มพ. 2569",
      round: "รอบคัดเลือก",
      year: 2569,
      status: "OPEN",
    },
  });

  const application = await testDb.application.create({
    data: {
      userId: athleteUser.id,
      competitionId: competition.id,
      sport: "ฟุตบอล",
      category: "ชาย",
      status: "SUBMITTED",
      photoFileUrl: "https://example.test/photo.pdf",
      idCardFileUrl: "https://example.test/id.pdf",
      studentCardFileUrl: "https://example.test/student.pdf",
      studentCertFileUrl: "https://example.test/cert.pdf",
      upAcademyFileUrl: "https://example.test/up.pdf",
      fitnessTestFileUrl: "https://example.test/fitness.pdf",
    },
  });

  try {
    // 1. Login as staff via API
    const loginRes = await fetch(`${apiBase}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: staffEmail, password }),
    });
    if (!loginRes.ok) throw new Error("Staff login failed: " + (await loginRes.text()));
    const staffCookie = loginRes.headers.getSetCookie().find(c => c.startsWith("token=")).split(";")[0];

    // 2. Fetch applications via /api/staff/applications with query filter
    const query = new URLSearchParams({ search: studentId, competitionId: competition.id, sport: "ฟุตบอล", status: "SUBMITTED" }).toString();
    const appRes = await fetch(`${apiBase}/api/staff/applications?${query}`, {
      headers: { Cookie: staffCookie },
    });
    if (!appRes.ok) throw new Error("Fetch applications failed: " + (await appRes.text()));
    const { applications } = await appRes.json();
    console.log("   - Retrieved matching applications from API:", applications.length);

    // 3. Run exact exportExcel mapping logic from StaffReview.tsx
    const rows = applications.map(a => ({
      "รหัสใบสมัคร": a.id,
      "รหัสนิสิต": a.user.studentId ?? "",
      "ชื่อ": a.user.profile?.firstName ?? "",
      "นามสกุล": a.user.profile?.lastName ?? "",
      "คณะ": a.user.profile?.faculty ?? "",
      "สาขาวิชา": a.user.profile?.major ?? "",
      "เบอร์โทรศัพท์": a.user.profile?.phone ?? "",
      "การแข่งขัน": a.competition.name,
      "ชนิดกีฬา": a.sport,
      "ประเภท": a.category ?? "",
      "สถานะ": statusLabel[a.status] ?? a.status,
      "วันที่สมัคร": a.createdAt ? new Date(a.createdAt).toLocaleString("th-TH") : ""
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applicants");

    const xlsxFilePath = "test-results/staff-export-generated.xlsx";
    XLSX.writeFile(workbook, xlsxFilePath);
    console.log("   - Wrote XLSX file to:", xlsxFilePath);

    // 4. Read back the XLSX file and verify contents thoroughly
    const readWb = XLSX.readFile(xlsxFilePath);
    const sheetName = readWb.SheetNames[0];
    if (sheetName !== "Applicants") throw new Error(`Expected sheet 'Applicants', got '${sheetName}'`);

    const parsedRows = XLSX.utils.sheet_to_json(readWb.Sheets[sheetName]);
    console.log("   - Parsed rows from XLSX:", parsedRows.length);
    if (parsedRows.length !== 1) throw new Error(`Expected 1 row, got ${parsedRows.length}`);

    const firstRow = parsedRows[0];
    const expectedHeaders = [
      "รหัสใบสมัคร",
      "รหัสนิสิต",
      "ชื่อ",
      "นามสกุล",
      "คณะ",
      "สาขาวิชา",
      "เบอร์โทรศัพท์",
      "การแข่งขัน",
      "ชนิดกีฬา",
      "ประเภท",
      "สถานะ",
      "วันที่สมัคร"
    ];

    const actualHeaders = Object.keys(firstRow);
    const headersMatch = JSON.stringify(actualHeaders) === JSON.stringify(expectedHeaders);
    console.log("   - Header count:", actualHeaders.length);
    console.log("   - Headers match expected 12 columns perfectly:", headersMatch);

    // Check specific Thai values
    const thaiValuesValid =
      firstRow["รหัสใบสมัคร"] === application.id &&
      firstRow["รหัสนิสิต"] === studentId &&
      firstRow["ชื่อ"] === "สมชาย" &&
      firstRow["นามสกุล"] === "ใจดี" &&
      firstRow["คณะ"] === "คณะวิทยาศาสตร์" &&
      firstRow["สาขาวิชา"] === "วิทยาการคอมพิวเตอร์" &&
      firstRow["เบอร์โทรศัพท์"] === "0812345678" &&
      firstRow["การแข่งขัน"] === "การแข่งขันกีฬาประเพณี มพ. 2569" &&
      firstRow["ชนิดกีฬา"] === "ฟุตบอล" &&
      firstRow["ประเภท"] === "ชาย" &&
      firstRow["สถานะ"] === (statusLabel["SUBMITTED"] ?? "SUBMITTED") &&
      typeof firstRow["วันที่สมัคร"] === "string" && firstRow["วันที่สมัคร"].length > 0;

    console.log("   - Thai values, UTF-8 integrity, and status label match:", thaiValuesValid);

    const verificationResult = {
      source: "generated-from-api-not-browser-download",
      timestamp: new Date().toISOString(),
      file: xlsxFilePath,
      fileSizeBytes: fs.statSync(xlsxFilePath).size,
      sheetName,
      rowCount: parsedRows.length,
      headers: actualHeaders,
      sampleRow: firstRow,
      checks: {
        sheetNameCorrect: sheetName === "Applicants",
        columnCount12: actualHeaders.length === 12,
        columnOrderAndNamesMatch: headersMatch,
        thaiEncodingValid: thaiValuesValid,
        statusLabelTranslated: firstRow["สถานะ"] === "รอการพิจารณา",
        dateFormatted: typeof firstRow["วันที่สมัคร"] === "string",
      },
      passed: sheetName === "Applicants" && actualHeaders.length === 12 && headersMatch && thaiValuesValid,
    };

    fs.writeFileSync("test-results/xlsx-verification.json", JSON.stringify(verificationResult, null, 2), "utf8");
    console.log("XLSX verification artifact saved to test-results/xlsx-verification.json successfully!");
    if (!verificationResult.passed) throw new Error("Workbook verification failed");

  } finally {
    // Cleanup fixtures
    await testDb.application.deleteMany({ where: { id: application.id } });
    await testDb.competition.deleteMany({ where: { id: competition.id } });
    await testDb.user.deleteMany({ where: { id: { in: [staffUser.id, athleteUser.id] } } });
    await testDb.$disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
