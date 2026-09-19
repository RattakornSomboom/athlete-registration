-- CreateEnum
CREATE TYPE "RosterStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'RETURNED');

-- CreateEnum
CREATE TYPE "OfficialStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CLUB_APPROVED', 'STAFF_APPROVED', 'CLUB_REJECTED', 'STAFF_REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TEAM_OFFICIAL';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "studentId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PrivateDocument" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerRole" "Role" NOT NULL,
    "purpose" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'READY',
    "retained" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubRoster" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "status" "RosterStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 0,
    "documentId" TEXT,
    "submittedBy" TEXT,
    "submittedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubRoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RosterItem" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "squadType" TEXT NOT NULL,

    CONSTRAINT "RosterItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RosterEvent" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RosterEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "profile" JSONB NOT NULL,
    "documents" JSONB NOT NULL,
    "status" "OfficialStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrivateDocument_path_key" ON "PrivateDocument"("path");

-- CreateIndex
CREATE INDEX "PrivateDocument_ownerId_ownerRole_idx" ON "PrivateDocument"("ownerId", "ownerRole");

-- CreateIndex
CREATE UNIQUE INDEX "ClubRoster_clubId_competitionId_key" ON "ClubRoster"("clubId", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "RosterItem_applicationId_key" ON "RosterItem"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficialApplication_userId_competitionId_key" ON "OfficialApplication"("userId", "competitionId");

-- AddForeignKey
ALTER TABLE "ClubRoster" ADD CONSTRAINT "ClubRoster_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubRoster" ADD CONSTRAINT "ClubRoster_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterItem" ADD CONSTRAINT "RosterItem_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "ClubRoster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterItem" ADD CONSTRAINT "RosterItem_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterEvent" ADD CONSTRAINT "RosterEvent_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "ClubRoster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialApplication" ADD CONSTRAINT "OfficialApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialApplication" ADD CONSTRAINT "OfficialApplication_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialApplication" ADD CONSTRAINT "OfficialApplication_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialEvent" ADD CONSTRAINT "OfficialEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "OfficialApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
