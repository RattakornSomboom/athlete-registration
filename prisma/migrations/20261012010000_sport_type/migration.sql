CREATE TYPE "SportType" AS ENUM ('TEAM', 'INDIVIDUAL');

ALTER TABLE "SportConfig"
ADD COLUMN "sportType" "SportType" NOT NULL DEFAULT 'INDIVIDUAL';

UPDATE "SportConfig"
SET "sportType" = 'TEAM'
WHERE "name" ILIKE '%ฟุตบอล%'
   OR "name" ILIKE '%ฟุตซอล%'
   OR "name" ILIKE '%บาสเกตบอล%'
   OR "name" ILIKE '%วอลเลย์บอล%'
   OR "name" ILIKE '%อีสปอร์ต%'
   OR "name" ILIKE '%เซปักตะกร้อ%';