-- AlterTable
ALTER TABLE "embed_chats" ADD COLUMN "conversation_id" TEXT;

-- Backfill: Set conversation_id = session_id for existing chats (backwards compatibility)
UPDATE "embed_chats" SET "conversation_id" = "session_id" WHERE "conversation_id" IS NULL;

-- CreateIndex
CREATE INDEX "embed_chats_conversation_id_idx" ON "embed_chats"("conversation_id");
