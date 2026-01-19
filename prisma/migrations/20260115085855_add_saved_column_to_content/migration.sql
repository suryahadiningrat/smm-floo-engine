-- AlterTable
ALTER TABLE "metric"."instagram_content" ADD COLUMN     "saved" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "metric"."instagram_content_summary" ADD COLUMN     "saved" INTEGER NOT NULL DEFAULT 0;
