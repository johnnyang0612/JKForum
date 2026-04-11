-- ============================================================
-- 私訊系統 Migration
-- ============================================================

-- 對話表
CREATE TABLE IF NOT EXISTS "conversations" (
  "id"         TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- 對話參與者表
CREATE TABLE IF NOT EXISTS "conversation_participants" (
  "id"             TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "lastReadAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- 訊息表
CREATE TABLE IF NOT EXISTS "messages" (
  "id"             TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId"       TEXT NOT NULL,
  "content"        TEXT NOT NULL,
  "isDeleted"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- 索引
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key"
  ON "conversation_participants"("conversationId", "userId");

CREATE INDEX "conversation_participants_userId_idx"
  ON "conversation_participants"("userId");

CREATE INDEX "messages_conversationId_createdAt_idx"
  ON "messages"("conversationId", "createdAt");

CREATE INDEX "messages_senderId_idx"
  ON "messages"("senderId");

-- 外鍵
ALTER TABLE "conversation_participants"
  ADD CONSTRAINT "conversation_participants_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversation_participants"
  ADD CONSTRAINT "conversation_participants_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
