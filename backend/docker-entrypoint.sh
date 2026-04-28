#!/bin/sh
set -e

echo "[entrypoint] Generating Prisma client..."
npx prisma generate

echo "[entrypoint] Applying non-destructive category type migration if needed..."
npx prisma db execute --stdin <<'SQL'
DO $$
BEGIN
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
npx prisma db push --accept-data-loss --skip-generate

echo "[entrypoint] Starting backend..."
node src/server.js
