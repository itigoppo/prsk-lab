/*
  Warnings:

  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `avatar_url` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `discord_id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "public"."users" DROP CONSTRAINT "users_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "avatar_url" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "discord_id" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "public"."units" (
    "id" VARCHAR(32) NOT NULL,
    "bg_color" VARCHAR(10) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "color" VARCHAR(10) NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "short" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."characters" (
    "id" VARCHAR(32) NOT NULL,
    "avatar_url" VARCHAR(255),
    "bg_color" VARCHAR(10) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "color" VARCHAR(10) NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "short" VARCHAR(10) NOT NULL,
    "unit_id" VARCHAR(32),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "units_code_key" ON "public"."units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "characters_code_key" ON "public"."characters"("code");

-- AddForeignKey
ALTER TABLE "public"."characters" ADD CONSTRAINT "characters_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
