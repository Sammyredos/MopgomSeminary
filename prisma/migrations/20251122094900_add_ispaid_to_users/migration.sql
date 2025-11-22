-- Add isPaid flag to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false;