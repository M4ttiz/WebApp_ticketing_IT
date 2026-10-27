CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

CREATE TABLE "recurring_tickets" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIA',
    "frequency" "RecurrenceFrequency" NOT NULL,
    "day_of_week" INTEGER,
    "day_of_month" INTEGER,
    "time" VARCHAR(5) NOT NULL,
    "time_zone" VARCHAR(64) NOT NULL DEFAULT 'Europe/Rome',
    "next_run_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requester_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "recurring_tickets_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "tickets" ADD COLUMN "recurring_template_id" INTEGER;
ALTER TABLE "tickets" ADD COLUMN "occurrence_at" TIMESTAMP(3);
CREATE UNIQUE INDEX "tickets_recurring_template_id_occurrence_at_key" ON "tickets"("recurring_template_id", "occurrence_at");
CREATE INDEX "recurring_tickets_is_active_next_run_at_idx" ON "recurring_tickets"("is_active", "next_run_at");
ALTER TABLE "recurring_tickets" ADD CONSTRAINT "recurring_tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recurring_tickets" ADD CONSTRAINT "recurring_tickets_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_recurring_template_id_fkey" FOREIGN KEY ("recurring_template_id") REFERENCES "recurring_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
