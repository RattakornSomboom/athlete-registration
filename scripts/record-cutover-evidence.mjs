import "dotenv/config";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

const testEnv = dotenv.parse(fs.readFileSync(".env.release-test", "utf8"));
if (process.env.CUTOVER_ALLOW_WRITE !== "yes") {
  throw new Error("This legacy probe writes production storage. Use the read-only inspection instead; CUTOVER_ALLOW_WRITE=yes requires explicit authorization.");
}
if (testEnv.TEST_ALLOW_WRITE !== "yes" || !testEnv.TEST_DATABASE_URL ||
    testEnv.TEST_DATABASE_URL === process.env.DATABASE_URL || testEnv.SUPABASE_URL === process.env.SUPABASE_URL) {
  throw new Error("Explicit test-write authorization and isolated database/storage are required");
}
const prodDb = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const testDb = new PrismaClient({ adapter: new PrismaPg({ connectionString: testEnv.TEST_DATABASE_URL }) });
const prodSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const testSupabase = createClient(testEnv.SUPABASE_URL, testEnv.SUPABASE_SERVICE_ROLE_KEY);

function sanitizeUrl(urlString) {
  if (!urlString) return null;
  try {
    const u = new URL(urlString);
    return `${u.protocol}//${u.username ? "***:***@" : ""}${u.hostname}${u.port ? ":" + u.port : ""}${u.pathname}`;
  } catch {
    return "***";
  }
}

async function main() {
  console.log("Starting cutover evidence collection...");
  const evidence = {
    timestamp: new Date().toISOString(),
    environment: {
      productionDatabaseTarget: sanitizeUrl(process.env.DATABASE_URL),
      testDatabaseTarget: sanitizeUrl(testEnv.TEST_DATABASE_URL),
      productionSupabaseOrigin: new URL(process.env.SUPABASE_URL).origin,
      testSupabaseOrigin: new URL(testEnv.SUPABASE_URL).origin,
    },
    preflight: null,
    prismaMigrateStatus: null,
    productionStorageBuckets: null,
    legacyFileLiveSecurityTest: null,
    signedUrlLifecycleTest: null,
  };

  // 1. Preflight execution on Production DB
  console.log("1. Running preflight check on production database...");
  const roles = await prodDb.$queryRaw`SELECT "role"::text AS role, COUNT(*)::int AS count FROM "User" GROUP BY "role"`;
  const documents = await prodDb.$queryRaw`SELECT "ownerRole"::text AS role, COUNT(*)::int AS count FROM "PrivateDocument" GROUP BY "ownerRole"`;
  const duplicates = await prodDb.$queryRaw`SELECT COUNT(*)::int AS count FROM (SELECT 1 FROM "SportQuota" GROUP BY "competitionId", "sport" HAVING COUNT(*) > 1) duplicates`;
  const admins = await prodDb.$queryRaw`SELECT COUNT(*)::int AS count FROM "User" WHERE "isActive" AND "role"::text IN ('ADMIN', 'SUPERADMIN')`;

  evidence.preflight = {
    roles,
    documents,
    duplicateQuotaGroups: duplicates[0].count,
    activeAdminsAfterConversion: admins[0].count,
    passed: duplicates[0].count === 0 && admins[0].count > 0,
  };

  // 2. Prisma migrate status on Production DB
  console.log("2. Running prisma migrate status on production database...");
  try {
    const statusOutput = execSync("npx prisma migrate status", { encoding: "utf8" });
    evidence.prismaMigrateStatus = {
      exitCode: 0,
      output: statusOutput
        .split("\n")
        .filter(l => !l.includes("postgresql://") && !l.includes("postgres://") && !l.includes("password"))
        .join("\n")
        .trim(),
    };
  } catch (err) {
    evidence.prismaMigrateStatus = {
      exitCode: 1,
      error: err.message,
    };
  }

  // 3. Storage buckets status on Production Supabase
  console.log("3. Inspecting production storage buckets...");
  const { data: prodBuckets, error: bErr } = await prodSupabase.storage.listBuckets();
  if (bErr) throw new Error("Could not list production buckets: " + bErr.message);
  evidence.productionStorageBuckets = prodBuckets.map(b => ({
    name: b.name,
    public: b.public,
    fileSizeLimit: b.file_size_limit,
    allowedMimeTypes: b.allowed_mime_types,
  }));

  // 4. Live legacy document resolution test against test server running on localhost:3138
  console.log("4. Running actual legacy file security test against server on localhost:3138...");
  // Ensure athlete-docs exists as private on the test server's Supabase project
  const { data: testBuckets } = await testSupabase.storage.listBuckets();
  if (!testBuckets.some(b => b.name === "athlete-docs")) {
    await testSupabase.storage.createBucket("athlete-docs", { public: false });
  } else {
    await testSupabase.storage.updateBucket("athlete-docs", { public: false });
  }

  const legacyFileName = `legacy-audit-${Date.now()}.pdf`;
  const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");

  // Upload to test server's athlete-docs bucket
  const { error: testUpErr } = await testSupabase.storage.from("athlete-docs").upload(legacyFileName, pdfBytes, {
    contentType: "application/pdf",
  });
  if (testUpErr) throw new Error("Failed to upload legacy probe to test storage: " + testUpErr.message);

  const publicLegacyUrl = `${testEnv.SUPABASE_URL}/storage/v1/object/public/athlete-docs/${legacyFileName}`;

  // Test A: Direct anonymous access to the legacy URL
  const anonRes = await fetch(publicLegacyUrl);
  const anonStatus = anonRes.status;
  const anonBody = await anonRes.text();
  console.log("   - Direct anonymous access status:", anonStatus);

  // Test B & C: Test via server application document API
  const testUserId = `test-athlete-${Date.now()}`;
  const otherUserId = `other-athlete-${Date.now()}`;
  const testCompId = `test-comp-${Date.now()}`;
  const testAppId = `test-app-${Date.now()}`;
  const studentId = "8" + String(Date.now()).slice(-7);
  const otherStudentId = "8" + String(Date.now() + 1).slice(-7);
  const testPassword = "AuditPassword123!";
  const hashedPassword = await bcrypt.hash(testPassword, 4);

  let authorizedApiStatus = null;
  let authorizedDownloadStatus = null;
  let unauthorizedApiStatus = null;
  let anonymousApiStatus = null;

  const apiBase = testEnv.TEST_BASE_URL || "http://localhost:3138";

  try {
    // Create fixtures on test DB
    await testDb.user.createMany({
      data: [
        { id: testUserId, studentId, email: `${testUserId}@example.test`, password: hashedPassword, role: "ATHLETE" },
        { id: otherUserId, studentId: otherStudentId, email: `${otherUserId}@example.test`, password: hashedPassword, role: "ATHLETE" },
      ],
    });

    await testDb.competition.create({
      data: {
        id: testCompId,
        name: "Legacy Audit Test Competition",
        round: "audit",
        year: 2569,
        status: "OPEN",
      },
    });

    await testDb.application.create({
      data: {
        id: testAppId,
        userId: testUserId,
        competitionId: testCompId,
        sport: "football",
        category: "male",
        status: "SUBMITTED",
        photoFileUrl: "https://example.test/photo.pdf",
        idCardFileUrl: publicLegacyUrl, // Real legacy URL pointing to athlete-docs of this environment!
        studentCardFileUrl: "https://example.test/student.pdf",
        studentCertFileUrl: "https://example.test/cert.pdf",
        upAcademyFileUrl: "https://example.test/up.pdf",
        fitnessTestFileUrl: "https://example.test/fitness.pdf",
      },
    });

    // Login via API to get cookies
    const loginRes = await fetch(`${apiBase}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: studentId, password: testPassword }),
    });
    const authCookie = loginRes.headers.getSetCookie().find(c => c.startsWith("token=")).split(";")[0];

    const otherLoginRes = await fetch(`${apiBase}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: otherStudentId, password: testPassword }),
    });
    const otherCookie = otherLoginRes.headers.getSetCookie().find(c => c.startsWith("token=")).split(";")[0];

    // Test B: Authorized owner requests their document
    const authRes = await fetch(`${apiBase}/api/applications/${testAppId}/documents/idCardFileUrl`, {
      headers: { Cookie: authCookie },
      redirect: "manual",
    });
    authorizedApiStatus = authRes.status;
    const signedLocation = authRes.headers.get("location");
    console.log("   - Authorized API status:", authorizedApiStatus, "Location present:", !!signedLocation);

    if (signedLocation) {
      const dlRes = await fetch(signedLocation);
      authorizedDownloadStatus = dlRes.status;
      const dlText = await dlRes.text();
      console.log("   - Authorized signed URL download status:", authorizedDownloadStatus, "Is valid PDF:", dlText.startsWith("%PDF"));
    }

    // Test C: Unauthorized different athlete requests document
    const unauthRes = await fetch(`${apiBase}/api/applications/${testAppId}/documents/idCardFileUrl`, {
      headers: { Cookie: otherCookie },
      redirect: "manual",
    });
    unauthorizedApiStatus = unauthRes.status;
    console.log("   - Unauthorized out-of-scope athlete status:", unauthorizedApiStatus);

    // Test D: Anonymous access to API endpoint
    const anonApiRes = await fetch(`${apiBase}/api/applications/${testAppId}/documents/idCardFileUrl`, {
      redirect: "manual",
    });
    anonymousApiStatus = anonApiRes.status;
    console.log("   - Anonymous API access status:", anonymousApiStatus);

  } finally {
    // Cleanup fixtures on test DB
    await testDb.application.deleteMany({ where: { id: testAppId } });
    await testDb.competition.deleteMany({ where: { id: testCompId } });
    await testDb.user.deleteMany({ where: { id: { in: [testUserId, otherUserId] } } });
    // Cleanup storage fixture in test storage
    const { error: cleanupError } = await testSupabase.storage.from("athlete-docs").remove([legacyFileName]);
    if (cleanupError) throw new Error("Test storage cleanup failed");
  }

  evidence.legacyFileLiveSecurityTest = {
    environment: "test",
    source: "newly-created-fixture-not-existing-production-file",
    testFileName: legacyFileName,
    directAnonymousAccess: {
      urlSanitized: sanitizeUrl(publicLegacyUrl),
      httpStatus: anonStatus,
      blocked: [400, 401, 403, 404].includes(anonStatus),
      responseBody: anonBody,
    },
    authorizedAccessViaApi: {
      httpStatus: authorizedApiStatus,
      redirectedToSignedUrl: authorizedApiStatus === 302,
      signedUrlDownloadHttpStatus: authorizedDownloadStatus,
      success: authorizedApiStatus === 302 && authorizedDownloadStatus === 200,
    },
    unauthorizedAccessViaApi: {
      httpStatus: unauthorizedApiStatus,
      rejected: unauthorizedApiStatus === 403 || unauthorizedApiStatus === 404,
    },
    anonymousAccessViaApi: {
      httpStatus: anonymousApiStatus,
      rejected: anonymousApiStatus === 401,
    },
  };

  // 5. Signed URL lifecycle in Production athlete-private
  console.log("5. Running production athlete-private signed URL lifecycle test...");
  const privateProbeName = `private-audit-${Date.now()}.pdf`;
  const { error: privUpErr } = await prodSupabase.storage.from("athlete-private").upload(privateProbeName, pdfBytes, {
    contentType: "application/pdf",
  });
  if (privUpErr) throw new Error("Production probe upload failed");
  let privSignData;
  let privSignErr;
  let privDlStatus;
  let cleanupError;
  try {
    ({ data: privSignData, error: privSignErr } = await prodSupabase.storage.from("athlete-private").createSignedUrl(privateProbeName, 60));
    if (privSignErr || !privSignData?.signedUrl) throw new Error("Production signing failed");
    const privDlRes = await fetch(privSignData.signedUrl);
    privDlStatus = privDlRes.status;
  } finally {
    ({ error: cleanupError } = await prodSupabase.storage.from("athlete-private").remove([privateProbeName]));
    if (cleanupError) throw new Error("Production probe cleanup failed");
  }

  evidence.signedUrlLifecycleTest = {
    bucket: "athlete-private",
    probeFile: privateProbeName,
    uploadSuccess: !privUpErr,
    signSuccess: !privSignErr && !!privSignData?.signedUrl,
    downloadHttpStatus: privDlStatus,
    cleanupSuccess: !cleanupError,
  };

  fs.writeFileSync("test-results/cutover-evidence.json", JSON.stringify(evidence, null, 2), "utf8");
  if (!evidence.preflight.passed || evidence.prismaMigrateStatus.exitCode !== 0 ||
      !evidence.legacyFileLiveSecurityTest.directAnonymousAccess.blocked ||
      !evidence.legacyFileLiveSecurityTest.authorizedAccessViaApi.success ||
      !evidence.legacyFileLiveSecurityTest.unauthorizedAccessViaApi.rejected ||
      !evidence.legacyFileLiveSecurityTest.anonymousAccessViaApi.rejected ||
      !evidence.signedUrlLifecycleTest.uploadSuccess || !evidence.signedUrlLifecycleTest.signSuccess ||
      privDlStatus !== 200 || cleanupError) throw new Error("Cutover probe checks failed");
  console.log("Cutover evidence saved to test-results/cutover-evidence.json successfully!");

  await prodDb.$disconnect();
  await testDb.$disconnect();
}

main().catch(() => {
  console.error("Cutover evidence collection failed; do not treat previous artifacts as current evidence.");
  process.exitCode = 1;
}).finally(async () => {
  await Promise.allSettled([prodDb.$disconnect(), testDb.$disconnect()]);
});
