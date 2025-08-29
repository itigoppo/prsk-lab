-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('Admin', 'Editor', 'Viewer');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "avatar_url" TEXT,
    "discord_id" TEXT NOT NULL,
    "email" VARCHAR(255),
    "name" VARCHAR(255),
    "role" "public"."UserRole" NOT NULL DEFAULT 'Viewer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_discord_id_key" ON "public"."users"("discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");
