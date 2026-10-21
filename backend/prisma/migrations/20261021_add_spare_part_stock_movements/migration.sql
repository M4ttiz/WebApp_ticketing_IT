CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "spare_part_stock_movements" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "spare_part_id" VARCHAR(36) NOT NULL,
  "ticket_id" INTEGER NULL,
  "movement_type" VARCHAR(20) NOT NULL CHECK ("movement_type" IN ('POSITIVE', 'NEGATIVE')),
  "quantity" INTEGER NOT NULL CHECK ("quantity" > 0),
  "note" TEXT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "spare_part_stock_movements_spare_part_fk"
    FOREIGN KEY ("spare_part_id") REFERENCES "spare_parts"("id") ON DELETE RESTRICT,
  CONSTRAINT "spare_part_stock_movements_ticket_fk"
    FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "spare_part_stock_movements_spare_part_created_idx"
  ON "spare_part_stock_movements" ("spare_part_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "spare_part_stock_movements_ticket_idx"
  ON "spare_part_stock_movements" ("ticket_id");
