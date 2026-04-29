#!/bin/sh
set -e

echo "[entrypoint] Generating Prisma client..."
npx prisma generate

echo "[entrypoint] Applying non-destructive category type migration if needed..."
npx prisma --schema prisma/schema.prisma db execute --stdin <<'SQL' || true
DO $$
BEGIN
  -- Add viewer role if missing (safe for existing deployments).
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'Role'
  ) THEN
    BEGIN
      ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'viewer';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assets'
      AND column_name = 'category'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE "assets"
      ALTER COLUMN "category" TYPE TEXT
      USING "category"::text;
  END IF;
END $$;
SQL

echo "[entrypoint] Syncing schema to database (db push)..."
if ! npx prisma --schema prisma/schema.prisma db push --accept-data-loss --skip-generate; then
  echo "[entrypoint] WARNING: prisma db push failed, continuing with existing schema."
fi

echo "[entrypoint] Starting backend..."
node src/server.js
