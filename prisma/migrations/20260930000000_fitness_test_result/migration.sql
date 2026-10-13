-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "FitnessTestStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "FitnessTestResult" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "FitnessTestStatus" NOT NULL DEFAULT 'PENDING',
    "totalScore" DOUBLE PRECISION,
    "scores" JSONB,
    "notes" TEXT,
    "testedAt" TIMESTAMP(3),
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FitnessTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "FitnessTestResult_applicationId_key" ON "FitnessTestResult"("applicationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FitnessTestResult_status_idx" ON "FitnessTestResult"("status");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "FitnessTestResult" ADD CONSTRAINT "FitnessTestResult_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
