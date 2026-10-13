// Usage: node scripts/release-preflight.mjs
// Read-only preflight verification for database schema and administrative gates.
// Strictly NO database modifications are performed.

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("FAIL: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function runPreflight() {
  console.log("==================================================");
  console.log("       DEPLOYMENT PREFLIGHT READ-ONLY AUDIT       ");
  console.log("==================================================");

  let allPassed = true;

  try {
    // 1. Verify Active Admins
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    });
    console.log(`[1] Active ADMIN users: ${activeAdmins}`);
    if (activeAdmins < 1) {
      console.error("    -> FAIL: System must have at least one active ADMIN account.");
      allPassed = false;
    } else {
      console.log("    -> PASS: System has valid active administrator account(s).");
    }

    // 2. Check for duplicate quota groups
    const duplicateQuotas = await prisma.sportQuota.groupBy({
      by: ["competitionId", "sport"],
      _count: { sport: true },
      having: { sport: { _count: { gt: 1 } } },
    });
    console.log(`[2] Duplicate SportQuota groups: ${duplicateQuotas.length}`);
    if (duplicateQuotas.length > 0) {
      console.error("    -> FAIL: Duplicate SportQuota groups found for competition/sport.");
      allPassed = false;
    } else {
      console.log("    -> PASS: No duplicate SportQuota groups.");
    }

    // 3. Verify latest schema models and columns accessibility
    const [configsCount, matchCount, applicationCount] = await Promise.all([
      prisma.sportConfig.count(),
      prisma.competitionMatch.count(),
      prisma.application.count(),
    ]);

    console.log(`[3] Schema model reachability:`);
    console.log(`    - SportConfig records: ${configsCount}`);
    console.log(`    - CompetitionMatch records: ${matchCount}`);
    console.log(`    - Application records: ${applicationCount}`);
    console.log("    -> PASS: Latest Phase 4 and SportType schema tables are readable.");

    // 4. Check for unhandled mustChangePassword on critical accounts
    const pendingPasswordResetAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true, mustChangePassword: true },
    });
    console.log(`[4] Active ADMINs with pending forced password change: ${pendingPasswordResetAdmins}`);

    console.log("==================================================");
    if (allPassed) {
      console.log("PREFLIGHT STATUS: ALL CHECKS PASSED (READY FOR DEPLOY)");
    } else {
      console.error("PREFLIGHT STATUS: ONE OR MORE CHECKS FAILED");
      process.exit(1);
    }
  } catch (error) {
    console.error("FAIL: Error during preflight verification:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

runPreflight();
