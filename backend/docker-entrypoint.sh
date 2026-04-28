#!/bin/sh
set -e

echo "[entrypoint] Generating Prisma client..."
npx prisma generate

echo "[entrypoint] Syncing schema to database (db push)..."
npx prisma db push --accept-data-loss --skip-generate

echo "[entrypoint] Starting backend..."
node src/server.js
