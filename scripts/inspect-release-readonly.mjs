import "dotenv/config";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { ATHLETE_DOCUMENT_FIELDS } from "../lib/athlete-document-policy.ts";

const result = { timestamp: new Date().toISOString(), mode: "read-only", passed: false, productionReady: false,
  applicationAuthorization: "not-tested: existing authorized production session required",
  emailDelivery: "not-tested", backupRestore: "not-tested" };
let db;
try {
  db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const storage = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY).storage;
  const origin = new URL(process.env.SUPABASE_URL).origin;
  const records = await db.$transaction(async tx => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    result.roles = await tx.$queryRaw`SELECT "role"::text AS role, COUNT(*)::int AS count FROM "User" GROUP BY "role"`;
    result.migrations = await tx.$queryRaw`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`;
    return tx.application.findMany({ select: Object.fromEntries(ATHLETE_DOCUMENT_FIELDS.map(field => [field, true])) });
  });
  const { data: buckets, error } = await storage.listBuckets();
  if (error) throw new Error("storage");
  result.buckets = buckets.map(b => ({ name: b.name, public: b.public }));
  const urls = [...new Set(records.flatMap(app => ATHLETE_DOCUMENT_FIELDS.map(field => app[field])).filter(v => typeof v === "string" && v.startsWith("http")))];
  result.legacy = { total: urls.length, checked: 0, publicBlocked: 0, serviceReadable: 0, unsupported: 0, unsupportedOrigins: [] };
  for (const value of urls) {
    const url = new URL(value);
    const prefix = "/storage/v1/object/public/athlete-docs/";
    if (url.origin !== origin || !url.pathname.startsWith(prefix) || url.search || url.hash) { result.legacy.unsupported++; result.legacy.unsupportedOrigins.push(url.origin); continue; }
    const response = await fetch(url, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(15000) });
    const { data, error: readError } = await storage.from("athlete-docs").download(decodeURIComponent(url.pathname.slice(prefix.length)));
    result.legacy.checked++;
    if ([400, 401, 403, 404].includes(response.status)) result.legacy.publicBlocked++;
    if (!readError && data?.size > 0) result.legacy.serviceReadable++;
  }
  result.legacyCoverage = urls.length ? "existing references; service access is not application authorization" : "no legacy references: verification remains untested";
  result.passed = ["athlete-private", "athlete-docs"].every(name => buckets.some(b => b.name === name && !b.public)) &&
    result.legacy.unsupported === 0 && result.legacy.publicBlocked === urls.length && result.legacy.serviceReadable === urls.length;
} catch {
  result.error = "Read-only inspection failed; credentials and record contents omitted";
} finally {
  if (db) await db.$disconnect();
  fs.writeFileSync("test-results/cutover-readonly-evidence.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) process.exitCode = 1;
}
