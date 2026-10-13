-- AlterTable SportQuota
ALTER TABLE "SportQuota" ADD COLUMN "maxEntriesPerAthlete" INTEGER;
ALTER TABLE "SportQuota" ADD COLUMN "maxEntriesPerEvent" INTEGER;

-- CreateEnum CompetitionEventType
CREATE TYPE "CompetitionEventType" AS ENUM ('TEAM_MATCH', 'INDIVIDUAL_MATCH', 'RANKING', 'TIMED');

-- CreateTable CompetitionMatch
CREATE TABLE "CompetitionMatch" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "division" TEXT,
    "eventType" "CompetitionEventType" NOT NULL DEFAULT 'TEAM_MATCH',
    "stage" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "venue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable CompetitionMatchEntry
CREATE TABLE "CompetitionMatchEntry" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "clubId" TEXT,
    "applicationId" TEXT,
    "participantName" TEXT,
    "side" TEXT,
    "score" DOUBLE PRECISION,
    "timeSeconds" DOUBLE PRECISION,
    "rank" INTEGER,
    "resultOutcome" TEXT,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionMatchEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompetitionMatchEntry_matchId_idx" ON "CompetitionMatchEntry"("matchId");

-- AddForeignKey
ALTER TABLE "CompetitionMatch" ADD CONSTRAINT "CompetitionMatch_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionMatchEntry" ADD CONSTRAINT "CompetitionMatchEntry_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "CompetitionMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionMatchEntry" ADD CONSTRAINT "CompetitionMatchEntry_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionMatchEntry" ADD CONSTRAINT "CompetitionMatchEntry_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
