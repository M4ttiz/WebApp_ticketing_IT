-- ============================================
-- Migration: Refactor enums + new tables
-- From: open/in_progress/on_hold/resolved/closed | low/medium/high/urgent
-- To:   APERTO/IN_LAVORAZIONE/IN_ATTESA/RISOLTO/CHIUSO/RIFIUTATO | BASSA/MEDIA/ALTA/CRITICA
-- ============================================

BEGIN;

-- ─── 1. Migrate TicketStatus enum ──────────────────────────────

-- Create new enum with Italian values
CREATE TYPE "TicketStatus_new" AS ENUM ('APERTO', 'IN_LAVORAZIONE', 'IN_ATTESA', 'RISOLTO', 'CHIUSO', 'RIFIUTATO');

-- Remove default to allow type change
ALTER TABLE "tickets" ALTER COLUMN "status" DROP DEFAULT;

-- Convert existing data using CASE mapping
ALTER TABLE "tickets" ALTER COLUMN "status" TYPE "TicketStatus_new" USING (
  CASE "status"
    WHEN 'open' THEN 'APERTO'::"TicketStatus_new"
    WHEN 'in_progress' THEN 'IN_LAVORAZIONE'::"TicketStatus_new"
    WHEN 'on_hold' THEN 'IN_ATTESA'::"TicketStatus_new"
    WHEN 'resolved' THEN 'RISOLTO'::"TicketStatus_new"
    WHEN 'closed' THEN 'CHIUSO'::"TicketStatus_new"
    ELSE 'APERTO'::"TicketStatus_new"
  END
);

-- Set new default
ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'APERTO';

-- Drop old enum and rename new one
DROP TYPE "TicketStatus";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";

-- ─── 2. Migrate Priority enum ──────────────────────────────────

CREATE TYPE "Priority_new" AS ENUM ('BASSA', 'MEDIA', 'ALTA', 'CRITICA');

ALTER TABLE "tickets" ALTER COLUMN "priority" DROP DEFAULT;

ALTER TABLE "tickets" ALTER COLUMN "priority" TYPE "Priority_new" USING (
  CASE "priority"
    WHEN 'low' THEN 'BASSA'::"Priority_new"
    WHEN 'medium' THEN 'MEDIA'::"Priority_new"
    WHEN 'high' THEN 'ALTA'::"Priority_new"
    WHEN 'urgent' THEN 'CRITICA'::"Priority_new"
    ELSE 'MEDIA'::"Priority_new"
  END
);

ALTER TABLE "tickets" ALTER COLUMN "priority" SET DEFAULT 'MEDIA';

DROP TYPE "Priority";
ALTER TYPE "Priority_new" RENAME TO "Priority";

-- ─── 3. Add isInternal to ticket_messages ──────────────────────

ALTER TABLE "ticket_messages" ADD COLUMN "is_internal" BOOLEAN NOT NULL DEFAULT false;

-- ─── 4. Create AuditLog table ──────────────────────────────────

CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_ticket_id_idx" ON "audit_logs"("ticket_id");
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_ticket_id_fkey" 
    FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── 5. Create Notification table ──────────────────────────────

CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "ticket_id" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── 6. Update indexes on tickets table ────────────────────────

-- Existing indexes on status/priority should still work after type change
-- but we verify they exist (PostgreSQL updates them automatically with ALTER TYPE)

COMMIT;

