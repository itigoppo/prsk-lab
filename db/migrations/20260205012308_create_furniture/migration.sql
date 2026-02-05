-- CreateTable
CREATE TABLE "furniture_tags" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "furniture_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "furniture_groups" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "furniture_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "furniture_group_excluded_characters" (
    "id" VARCHAR(32) NOT NULL,
    "group_id" VARCHAR(32) NOT NULL,
    "combination_id" VARCHAR(32) NOT NULL,
    "character_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "furniture_group_excluded_characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "furnitures" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "tag_id" VARCHAR(32) NOT NULL,
    "group_id" VARCHAR(32),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "furnitures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_furnitures" (
    "id" VARCHAR(32) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "furniture_id" VARCHAR(32) NOT NULL,

    CONSTRAINT "user_furnitures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "furniture_reactions" (
    "id" VARCHAR(32) NOT NULL,
    "furniture_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "furniture_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "furniture_reaction_characters" (
    "id" VARCHAR(32) NOT NULL,
    "reaction_id" VARCHAR(32) NOT NULL,
    "character_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "furniture_reaction_characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reaction_checks" (
    "id" VARCHAR(32) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "reaction_id" VARCHAR(32) NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reaction_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "furniture_tags_name_key" ON "furniture_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "furniture_groups_name_key" ON "furniture_groups"("name");

-- CreateIndex
CREATE INDEX "furniture_group_excluded_characters_group_id_idx" ON "furniture_group_excluded_characters"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "furniture_group_excluded_characters_combination_id_characte_key" ON "furniture_group_excluded_characters"("combination_id", "character_id");

-- CreateIndex
CREATE UNIQUE INDEX "furnitures_tag_id_name_key" ON "furnitures"("tag_id", "name");

-- CreateIndex
CREATE INDEX "user_furnitures_user_id_idx" ON "user_furnitures"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_furnitures_user_id_furniture_id_key" ON "user_furnitures"("user_id", "furniture_id");

-- CreateIndex
CREATE UNIQUE INDEX "furniture_reaction_characters_reaction_id_character_id_key" ON "furniture_reaction_characters"("reaction_id", "character_id");

-- CreateIndex
CREATE INDEX "user_reaction_checks_user_id_idx" ON "user_reaction_checks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_reaction_checks_user_id_reaction_id_key" ON "user_reaction_checks"("user_id", "reaction_id");

-- AddForeignKey
ALTER TABLE "furniture_group_excluded_characters" ADD CONSTRAINT "furniture_group_excluded_characters_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "furniture_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_group_excluded_characters" ADD CONSTRAINT "furniture_group_excluded_characters_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furnitures" ADD CONSTRAINT "furnitures_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "furniture_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furnitures" ADD CONSTRAINT "furnitures_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "furniture_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_furnitures" ADD CONSTRAINT "user_furnitures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_furnitures" ADD CONSTRAINT "user_furnitures_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "furnitures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_reactions" ADD CONSTRAINT "furniture_reactions_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "furnitures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_reaction_characters" ADD CONSTRAINT "furniture_reaction_characters_reaction_id_fkey" FOREIGN KEY ("reaction_id") REFERENCES "furniture_reactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reaction_checks" ADD CONSTRAINT "user_reaction_checks_reaction_id_fkey" FOREIGN KEY ("reaction_id") REFERENCES "furniture_reactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
