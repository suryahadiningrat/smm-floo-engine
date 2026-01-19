/*
  Warnings:

  - You are about to drop the `master.plan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `master.projects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `master.users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metric.instagram_account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metric.instagram_content` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metric.instagram_content_summary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metric.platform_account_summary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metric.tiktok_account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metric.tiktok_content` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metric.tiktok_content_summary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metric.youtube_account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metric.youtube_content` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metric.youtube_content_summary` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "master";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "metric";

-- CreateEnum
CREATE TYPE "metric"."ProjectPlatform" AS ENUM ('instagram', 'tiktok', 'youtube');

-- CreateEnum
CREATE TYPE "metric"."InstagramType" AS ENUM ('post', 'reels', 'story');

-- CreateEnum
CREATE TYPE "metric"."YoutubeType" AS ENUM ('short', 'story', 'video');

-- DropForeignKey
ALTER TABLE "master.projects" DROP CONSTRAINT "master.projects_user_id_fkey";

-- DropForeignKey
ALTER TABLE "master.users" DROP CONSTRAINT "master.users_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "metric.instagram_account" DROP CONSTRAINT "metric.instagram_account_project_id_fkey";

-- DropForeignKey
ALTER TABLE "metric.instagram_content" DROP CONSTRAINT "metric.instagram_content_project_id_fkey";

-- DropForeignKey
ALTER TABLE "metric.instagram_content_summary" DROP CONSTRAINT "metric.instagram_content_summary_project_id_fkey";

-- DropForeignKey
ALTER TABLE "metric.platform_account_summary" DROP CONSTRAINT "metric.platform_account_summary_project_id_fkey";

-- DropForeignKey
ALTER TABLE "metric.tiktok_account" DROP CONSTRAINT "metric.tiktok_account_project_id_fkey";

-- DropForeignKey
ALTER TABLE "metric.tiktok_content" DROP CONSTRAINT "metric.tiktok_content_project_id_fkey";

-- DropForeignKey
ALTER TABLE "metric.tiktok_content_summary" DROP CONSTRAINT "metric.tiktok_content_summary_project_id_fkey";

-- DropForeignKey
ALTER TABLE "metric.youtube_account" DROP CONSTRAINT "metric.youtube_account_project_id_fkey";

-- DropForeignKey
ALTER TABLE "metric.youtube_content" DROP CONSTRAINT "metric.youtube_content_project_id_fkey";

-- DropForeignKey
ALTER TABLE "metric.youtube_content_summary" DROP CONSTRAINT "metric.youtube_content_summary_project_id_fkey";

-- DropTable
DROP TABLE "master.plan";

-- DropTable
DROP TABLE "master.projects";

-- DropTable
DROP TABLE "master.users";

-- DropTable
DROP TABLE "metric.instagram_account";

-- DropTable
DROP TABLE "metric.instagram_content";

-- DropTable
DROP TABLE "metric.instagram_content_summary";

-- DropTable
DROP TABLE "metric.platform_account_summary";

-- DropTable
DROP TABLE "metric.tiktok_account";

-- DropTable
DROP TABLE "metric.tiktok_content";

-- DropTable
DROP TABLE "metric.tiktok_content_summary";

-- DropTable
DROP TABLE "metric.youtube_account";

-- DropTable
DROP TABLE "metric.youtube_content";

-- DropTable
DROP TABLE "metric.youtube_content_summary";

-- DropEnum
DROP TYPE "InstagramType";

-- DropEnum
DROP TYPE "ProjectPlatform";

-- DropEnum
DROP TYPE "YoutubeType";

-- CreateTable
CREATE TABLE "master"."plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "project_limit" INTEGER NOT NULL,

    CONSTRAINT "plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."users" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."projects" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metricool_user_id" TEXT,
    "metricool_blog_id" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric"."platform_account_summary" (
    "id" SERIAL NOT NULL,
    "platform" "metric"."ProjectPlatform" NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "platform_account_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric"."instagram_account" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric"."instagram_content" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "type" "metric"."InstagramType" NOT NULL,
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

    CONSTRAINT "instagram_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric"."instagram_content_summary" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "type" "metric"."InstagramType" NOT NULL,
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

    CONSTRAINT "instagram_content_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric"."tiktok_account" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tiktok_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric"."tiktok_content" (
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

    CONSTRAINT "tiktok_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric"."tiktok_content_summary" (
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

    CONSTRAINT "tiktok_content_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric"."youtube_account" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "youtube_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric"."youtube_content" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "type" "metric"."YoutubeType" NOT NULL,
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

    CONSTRAINT "youtube_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric"."youtube_content_summary" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "type" "metric"."YoutubeType" NOT NULL,
    "content_id" TEXT NOT NULL,
    "caption" TEXT,
    "media_url" TEXT,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "view" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "like" INTEGER NOT NULL DEFAULT 0,
    "comment" INTEGER NOT NULL DEFAULT 0,
    "share" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "youtube_content_summary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "master"."users" ADD CONSTRAINT "users_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "master"."plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master"."projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "master"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric"."platform_account_summary" ADD CONSTRAINT "platform_account_summary_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric"."instagram_account" ADD CONSTRAINT "instagram_account_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric"."instagram_content" ADD CONSTRAINT "instagram_content_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric"."instagram_content_summary" ADD CONSTRAINT "instagram_content_summary_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric"."tiktok_account" ADD CONSTRAINT "tiktok_account_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric"."tiktok_content" ADD CONSTRAINT "tiktok_content_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric"."tiktok_content_summary" ADD CONSTRAINT "tiktok_content_summary_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric"."youtube_account" ADD CONSTRAINT "youtube_account_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric"."youtube_content" ADD CONSTRAINT "youtube_content_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric"."youtube_content_summary" ADD CONSTRAINT "youtube_content_summary_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
