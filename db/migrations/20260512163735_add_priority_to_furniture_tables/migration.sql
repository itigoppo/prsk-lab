-- AlterTable
ALTER TABLE "furniture_groups" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "furniture_reactions" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "furniture_tags" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "furnitures" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "furniture_reaction_characters" ADD CONSTRAINT "furniture_reaction_characters_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reaction_checks" ADD CONSTRAINT "user_reaction_checks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
