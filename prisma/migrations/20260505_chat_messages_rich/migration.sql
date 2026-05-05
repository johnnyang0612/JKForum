-- ============================================================
-- chat_messages_rich
-- 升級即時聊天室訊息：圖片/貼圖/系統訊息、引用回覆、撤回、未讀計數、審核日誌
-- ============================================================

-- 1. 新增 ChatMessageType enum
DO $$ BEGIN
  CREATE TYPE "ChatMessageType" AS ENUM ('TEXT', 'IMAGE', 'STICKER', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. ChatMessage 升級
ALTER TABLE "chat_messages" ALTER COLUMN "content" TYPE TEXT;

ALTER TABLE "chat_messages"
  ADD COLUMN IF NOT EXISTS "message_type" "ChatMessageType" NOT NULL DEFAULT 'TEXT',
  ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "reply_to_id" TEXT,
  ADD COLUMN IF NOT EXISTS "edited_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- 3. ChatMessage self-relation (replyTo)
DO $$ BEGIN
  ALTER TABLE "chat_messages"
    ADD CONSTRAINT "chat_messages_reply_to_id_fkey"
    FOREIGN KEY ("reply_to_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "chat_messages_reply_to_id_idx" ON "chat_messages"("reply_to_id");

-- 4. ChatRoomRead — 每用戶每聊天室最後閱讀時間（未讀徽章用）
CREATE TABLE IF NOT EXISTS "chat_room_reads" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "room_id" TEXT NOT NULL,
  "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "chat_room_reads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "chat_room_reads_user_id_room_id_key" ON "chat_room_reads"("user_id", "room_id");
CREATE INDEX IF NOT EXISTS "chat_room_reads_user_id_idx" ON "chat_room_reads"("user_id");

DO $$ BEGIN
  ALTER TABLE "chat_room_reads"
    ADD CONSTRAINT "chat_room_reads_room_id_fkey"
    FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. ChatModerationLog — 圖片上傳/敏感詞攔截審核日誌
CREATE TABLE IF NOT EXISTS "chat_moderation_logs" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "room_id" TEXT NOT NULL,
  "message_id" TEXT,
  "kind" VARCHAR(40) NOT NULL,
  "url" TEXT,
  "detail" TEXT,
  "ip_address" VARCHAR(45),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_moderation_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "chat_moderation_logs_user_id_created_at_idx" ON "chat_moderation_logs"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "chat_moderation_logs_room_id_created_at_idx" ON "chat_moderation_logs"("room_id", "created_at");
CREATE INDEX IF NOT EXISTS "chat_moderation_logs_kind_created_at_idx" ON "chat_moderation_logs"("kind", "created_at");
