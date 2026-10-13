ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "clubId" TEXT;

CREATE INDEX IF NOT EXISTS "Application_clubId_competitionId_idx"
ON "Application"("clubId", "competitionId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Application_clubId_fkey'
      AND conrelid = '"Application"'::regclass
  ) THEN
    ALTER TABLE "Application" ADD CONSTRAINT "Application_clubId_fkey"
    FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;