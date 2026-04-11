-- VIP / 商城 / 任務系統 Migration SQL
-- ============================================================

-- VIP Enums
CREATE TYPE "VipPlan" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');
CREATE TYPE "VipStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- Shop Enums
CREATE TYPE "ShopItemType" AS ENUM ('BOOST', 'BADGE', 'FEATURE');

-- Task Enums
CREATE TYPE "TaskType" AS ENUM ('NEWBIE', 'DAILY', 'ACHIEVEMENT');

-- ============================================================
-- VIP 訂閱
-- ============================================================
CREATE TABLE "vip_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "VipPlan" NOT NULL,
    "status" "VipStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vip_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vip_subscriptions_userId_status_idx" ON "vip_subscriptions"("userId", "status");
CREATE INDEX "vip_subscriptions_endDate_idx" ON "vip_subscriptions"("endDate");

ALTER TABLE "vip_subscriptions" ADD CONSTRAINT "vip_subscriptions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 商城道具
-- ============================================================
CREATE TABLE "shop_items" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "type" "ShopItemType" NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" "PointType" NOT NULL,
    "iconUrl" TEXT,
    "effect" VARCHAR(200),
    "duration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shop_items_type_isActive_idx" ON "shop_items"("type", "isActive");

-- ============================================================
-- 用戶道具庫存
-- ============================================================
CREATE TABLE "user_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_items_userId_idx" ON "user_items"("userId");
CREATE INDEX "user_items_itemId_idx" ON "user_items"("itemId");

ALTER TABLE "user_items" ADD CONSTRAINT "user_items_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_items" ADD CONSTRAINT "user_items_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "shop_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 任務
-- ============================================================
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "target" INTEGER NOT NULL,
    "rewardCoins" INTEGER NOT NULL DEFAULT 0,
    "rewardReputation" INTEGER NOT NULL DEFAULT 0,
    "rewardGems" INTEGER NOT NULL DEFAULT 0,
    "badgeId" TEXT,
    "iconUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tasks_type_isActive_idx" ON "tasks"("type", "isActive");

-- ============================================================
-- 用戶任務進度
-- ============================================================
CREATE TABLE "user_task_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_task_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_task_progress_userId_taskId_key" ON "user_task_progress"("userId", "taskId");
CREATE INDEX "user_task_progress_userId_completed_idx" ON "user_task_progress"("userId", "completed");

ALTER TABLE "user_task_progress" ADD CONSTRAINT "user_task_progress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_task_progress" ADD CONSTRAINT "user_task_progress_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
