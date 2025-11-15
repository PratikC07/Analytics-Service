-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "inserted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_site_id_event_type_timestamp_idx" ON "Event"("site_id", "event_type", "timestamp");
