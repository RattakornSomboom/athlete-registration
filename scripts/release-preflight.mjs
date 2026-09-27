import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  const roles = await prisma.$queryRaw`SELECT "role"::text AS role, COUNT(*)::int AS count FROM "User" GROUP BY "role"`;
  const documents = await prisma.$queryRaw`SELECT "ownerRole"::text AS role, COUNT(*)::int AS count FROM "PrivateDocument" GROUP BY "ownerRole"`;
  const duplicates = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM (SELECT 1 FROM "SportQuota" GROUP BY "competitionId", "sport" HAVING COUNT(*) > 1) duplicates`;
  const admins = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "User" WHERE "isActive" AND "role"::text IN ('ADMIN', 'SUPERADMIN')`;
  console.log(JSON.stringify({ roles, documents, duplicateQuotaGroups: duplicates[0].count, activeAdminsAfterConversion: admins[0].count }, null, 2));
  if (duplicates[0].count || !admins[0].count) process.exitCode = 1;
} finally { await prisma.$disconnect(); }
