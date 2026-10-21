CREATE TABLE "spare_parts" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(100),
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "spare_parts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ticket_spare_parts" (
    "id" TEXT NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "spare_part_id" VARCHAR(36) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_spare_parts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ticket_spare_parts_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ticket_spare_parts_spare_part_id_fkey" FOREIGN KEY ("spare_part_id") REFERENCES "spare_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ticket_spare_parts_ticket_id_spare_part_id_key"
    ON "ticket_spare_parts"("ticket_id", "spare_part_id");

CREATE INDEX "spare_parts_name_idx"
    ON "spare_parts"("name");

CREATE INDEX "spare_parts_is_active_idx"
    ON "spare_parts"("is_active");

CREATE INDEX "ticket_spare_parts_ticket_id_idx"
    ON "ticket_spare_parts"("ticket_id");

CREATE INDEX "ticket_spare_parts_spare_part_id_idx"
    ON "ticket_spare_parts"("spare_part_id");
