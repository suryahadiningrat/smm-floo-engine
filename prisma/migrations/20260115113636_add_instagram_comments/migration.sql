-- CreateTable
CREATE TABLE "metric"."instagram_comments" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "content_id" TEXT NOT NULL,
    "commenters_username" TEXT NOT NULL,
    "text" TEXT,
    "comments_like" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "metric"."instagram_comments" ADD CONSTRAINT "instagram_comments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
