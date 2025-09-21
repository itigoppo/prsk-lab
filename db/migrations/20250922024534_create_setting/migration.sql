-- DropForeignKey
ALTER TABLE "public"."characters" DROP CONSTRAINT "characters_unit_id_fkey";

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "last_login_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."settings" (
    "id" VARCHAR(32) NOT NULL,
    "leader_sheet_url" VARCHAR(255),
    "user_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_user_id_key" ON "public"."settings"("user_id");

-- AddForeignKey
ALTER TABLE "public"."characters" ADD CONSTRAINT "characters_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."settings" ADD CONSTRAINT "settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
