-- Prepared only. Run during a maintenance window after backup and preflight.
BEGIN;
LOCK TABLE "User", "PrivateDocument", "SportQuota" IN ACCESS EXCLUSIVE MODE;

-- Preserve account state and document ownership when retiring the old role.
UPDATE "User" SET "role" = 'ADMIN', "updatedAt" = CURRENT_TIMESTAMP WHERE "role"::text = 'SUPERADMIN';
UPDATE "PrivateDocument" SET "ownerRole" = 'ADMIN' WHERE "ownerRole"::text = 'SUPERADMIN';

CREATE TYPE "Role_release" AS ENUM ('ATHLETE', 'CLUB', 'STAFF', 'ADMIN', 'TEAM_OFFICIAL');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_release" USING ("role"::text::"Role_release");
ALTER TABLE "PrivateDocument" ALTER COLUMN "ownerRole" TYPE "Role_release" USING ("ownerRole"::text::"Role_release");
DROP TYPE "Role";
ALTER TYPE "Role_release" RENAME TO "Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ATHLETE';

ALTER TABLE "User" ADD COLUMN "clubId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Duplicate quotas must be reconciled by an operator; never silently delete them.
CREATE UNIQUE INDEX "SportQuota_competitionId_sport_key" ON "SportQuota"("competitionId", "sport");
COMMIT;
