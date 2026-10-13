// Usage: node scripts/remove-sport.mjs "<sport name>" [--apply]
// Dry-run by default. Removes SportConfig and SportQuota rows only; refuses
// to touch the sport if clubs, applications or sport entries still use it.
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const name = process.argv[2];
const apply = process.argv.includes("--apply");
const includeData = process.argv.includes("--include-data");

if (!name || name.startsWith("--")) {
  console.error('Usage: node scripts/remove-sport.mjs "<sport name>" [--apply]');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const [configs, quotas, clubs, applications, entries, profiles] = await Promise.all([
    prisma.sportConfig.count({ where: { name } }),
    prisma.sportQuota.count({ where: { sport: name } }),
    prisma.club.count({ where: { sport: name } }),
    prisma.application.count({ where: { sport: name } }),
    prisma.sportEntry.count({ where: { sport: name } }),
    prisma.athleteProfile.count({ where: { firstSport: name } }),
  ]);

  console.log(`Sport: ${name}`);
  console.table({ configs, quotas, clubs, applications, entries, profiles });

  const inUse = clubs || applications || entries || profiles;

  if (inUse && includeData && apply) {
    const result = await prisma.$transaction([
      prisma.application.deleteMany({ where: { sport: name } }),
      prisma.sportEntry.deleteMany({ where: { sport: name } }),
      prisma.athleteProfile.deleteMany({ where: { firstSport: name } }),
      prisma.club.deleteMany({ where: { sport: name } }),
      prisma.sportConfig.deleteMany({ where: { name } }),
      prisma.sportQuota.deleteMany({ where: { sport: name } }),
    ]);
    console.log("Deleted:", result.map((r) => r.count).join(", "));
  } else if (inUse) {
    console.log("In use by clubs/applications/entries/profiles. Re-run with --apply --include-data to delete them too.");
  } else if (!configs && !quotas) {
    console.log("Nothing to delete.");
  } else if (!apply) {
    console.log("Dry-run. Re-run with --apply to delete configs and quotas.");
  } else {
    const [c, q] = await prisma.$transaction([
      prisma.sportConfig.deleteMany({ where: { name } }),
      prisma.sportQuota.deleteMany({ where: { sport: name } }),
    ]);
    console.log(`Deleted ${c.count} configs, ${q.count} quotas.`);
  }
} finally {
  await prisma.$disconnect();
  await pool.end();
}
