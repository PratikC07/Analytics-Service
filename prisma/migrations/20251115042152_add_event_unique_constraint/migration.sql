/*
  Warnings:

  - A unique constraint covering the columns `[site_id,user_id,path,timestamp]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Event_site_id_user_id_path_timestamp_key" ON "Event"("site_id", "user_id", "path", "timestamp");
