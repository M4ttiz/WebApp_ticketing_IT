ALTER TABLE "spare_parts"
  ADD COLUMN IF NOT EXISTS "minimum_stock" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "spare_parts_minimum_stock_idx"
  ON "spare_parts"("minimum_stock");
