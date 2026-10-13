-- AlterTable
ALTER TABLE "AthleteProfile" ADD COLUMN "semester" TEXT;

ALTER TABLE "AthleteProfile"
ADD CONSTRAINT "AthleteProfile_semester_check"
CHECK ("semester" IS NULL OR "semester" IN ('1', '2', '3'));
