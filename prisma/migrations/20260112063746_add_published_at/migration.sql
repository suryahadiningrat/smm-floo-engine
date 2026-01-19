-- CreateEnum
CREATE TYPE "ProjectPlatform" AS ENUM ('instagram', 'tiktok', 'youtube');

-- CreateEnum
CREATE TYPE "InstagramType" AS ENUM ('post', 'reels', 'story');

-- CreateEnum
CREATE TYPE "YoutubeType" AS ENUM ('short', 'story', 'video');

-- CreateTable
CREATE TABLE "master.plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "project_limit" INTEGER NOT NULL,

    CONSTRAINT "master.plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master.users" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master.users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master.projects" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metricool_user_id" TEXT,
    "metricool_blog_id" TEXT,

    CONSTRAINT "master.projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric.platform_account_summary" (
    "id" SERIAL NOT NULL,
    "platform" "ProjectPlatform" NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "metric.platform_account_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric.instagram_account" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric.instagram_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric.instagram_content" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "type" "InstagramType" NOT NULL,
    "content_id" TEXT NOT NULL,
    "caption" TEXT,
    "media_url" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "impression" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "like" INTEGER NOT NULL DEFAULT 0,
    "comment" INTEGER NOT NULL DEFAULT 0,
    "share" INTEGER NOT NULL DEFAULT 0,
    "repost" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric.instagram_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric.instagram_content_summary" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "type" "InstagramType" NOT NULL,
    "content_id" TEXT NOT NULL,
    "caption" TEXT,
    "media_url" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "impression" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "like" INTEGER NOT NULL DEFAULT 0,
    "comment" INTEGER NOT NULL DEFAULT 0,
    "share" INTEGER NOT NULL DEFAULT 0,
    "repost" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "metric.instagram_content_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric.tiktok_account" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric.tiktok_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric.tiktok_content" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "caption" TEXT,
    "media_url" TEXT,
    "view" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "like" INTEGER NOT NULL DEFAULT 0,
    "comment" INTEGER NOT NULL DEFAULT 0,
    "share" INTEGER NOT NULL DEFAULT 0,
    "repost" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric.tiktok_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric.tiktok_content_summary" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "caption" TEXT,
    "media_url" TEXT,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "view" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "like" INTEGER NOT NULL DEFAULT 0,
    "comment" INTEGER NOT NULL DEFAULT 0,
    "share" INTEGER NOT NULL DEFAULT 0,
    "repost" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "metric.tiktok_content_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric.youtube_account" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric.youtube_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric.youtube_content" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "type" "YoutubeType" NOT NULL,
    "content_id" TEXT NOT NULL,
    "caption" TEXT,
    "media_url" TEXT,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "view" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "like" INTEGER NOT NULL DEFAULT 0,
    "comment" INTEGER NOT NULL DEFAULT 0,
    "share" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric.youtube_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric.youtube_content_summary" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "type" "YoutubeType" NOT NULL,
    "content_id" TEXT NOT NULL,
    "caption" TEXT,
    "media_url" TEXT,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "view" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "like" INTEGER NOT NULL DEFAULT 0,
    "comment" INTEGER NOT NULL DEFAULT 0,
    "share" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "metric.youtube_content_summary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "master.users" ADD CONSTRAINT "master.users_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "master.plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master.projects" ADD CONSTRAINT "master.projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "master.users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric.platform_account_summary" ADD CONSTRAINT "metric.platform_account_summary_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master.projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric.instagram_account" ADD CONSTRAINT "metric.instagram_account_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master.projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric.instagram_content" ADD CONSTRAINT "metric.instagram_content_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master.projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric.instagram_content_summary" ADD CONSTRAINT "metric.instagram_content_summary_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master.projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric.tiktok_account" ADD CONSTRAINT "metric.tiktok_account_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master.projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric.tiktok_content" ADD CONSTRAINT "metric.tiktok_content_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master.projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric.tiktok_content_summary" ADD CONSTRAINT "metric.tiktok_content_summary_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master.projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric.youtube_account" ADD CONSTRAINT "metric.youtube_account_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master.projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric.youtube_content" ADD CONSTRAINT "metric.youtube_content_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master.projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric.youtube_content_summary" ADD CONSTRAINT "metric.youtube_content_summary_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master.projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
