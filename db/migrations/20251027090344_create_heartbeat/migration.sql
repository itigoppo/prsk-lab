-- CreateTable
CREATE TABLE "public"."heartbeat" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "last_seen" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "heartbeat_pkey" PRIMARY KEY ("id")
);
