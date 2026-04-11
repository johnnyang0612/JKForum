-- 廣告系統 Migration
-- Advertisement system for JKForum

-- 建立廣告位置列舉
CREATE TYPE "AdPosition" AS ENUM ('HOME_BANNER', 'SIDEBAR', 'POST_INLINE', 'OVERLAY', 'POPUP');

-- 建立廣告表
CREATE TABLE "advertisements" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "position" "AdPosition" NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "targetForums" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- 建立索引
CREATE INDEX "advertisements_position_isActive_startDate_endDate_idx"
    ON "advertisements"("position", "isActive", "startDate", "endDate");

CREATE INDEX "advertisements_isActive_idx"
    ON "advertisements"("isActive");
