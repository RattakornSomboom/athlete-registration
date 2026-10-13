-- Existing accounts remain enabled; API sessions consult this value on every request.
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
