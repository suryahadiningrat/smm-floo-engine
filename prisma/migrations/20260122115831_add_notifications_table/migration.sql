/*
  Warnings:

  - You are about to drop the `plan` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `projects` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "master"."enum_users_role" AS ENUM ('SUPERADMIN', 'ADMIN', 'USER');

-- DropForeignKey
ALTER TABLE "master"."users" DROP CONSTRAINT "users_plan_id_fkey";

-- AlterTable
ALTER TABLE "master"."projects" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "master"."users" ADD COLUMN     "password" TEXT,
ADD COLUMN     "refresh_token" TEXT,
ADD COLUMN     "role" "master"."enum_users_role",
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "metric"."instagram_comments" ADD COLUMN     "sentiment" TEXT;

-- DropTable
DROP TABLE "master"."plan";

-- CreateTable
CREATE TABLE "master"."plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "project_limit" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric"."analyze_comments" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "content_id" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "json_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analyze_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "master"."projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "master"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "master"."users"("username");

-- AddForeignKey
ALTER TABLE "master"."users" ADD CONSTRAINT "users_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "master"."plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "master"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric"."analyze_comments" ADD CONSTRAINT "analyze_comments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "master"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
