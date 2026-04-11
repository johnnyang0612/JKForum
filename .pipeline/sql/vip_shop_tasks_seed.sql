-- VIP / 商城 / 任務系統 Seed Data
-- ============================================================

-- ============================================================
-- 商城道具 (6 items)
-- ============================================================

-- 置頂卡 (BOOST)
INSERT INTO "shop_items" ("id", "name", "description", "type", "price", "currency", "iconUrl", "effect", "duration", "isActive", "sortOrder", "createdAt")
VALUES (
  'item_boost_pin', '置頂卡', '將你的文章置頂到看板最上方，讓更多人看到你的內容！', 'BOOST', 500, 'COINS',
  '/images/shop/pin-card.png', '文章置頂 24 小時', 24, true, 1, NOW()
);

-- 高亮卡 (BOOST)
INSERT INTO "shop_items" ("id", "name", "description", "type", "price", "currency", "iconUrl", "effect", "duration", "isActive", "sortOrder", "createdAt")
VALUES (
  'item_boost_highlight', '高亮卡', '為你的文章標題加上醒目的高亮顏色，吸引更多點擊！', 'BOOST', 300, 'COINS',
  '/images/shop/highlight-card.png', '文章標題高亮 48 小時', 48, true, 2, NOW()
);

-- 加速卡 (BOOST)
INSERT INTO "shop_items" ("id", "name", "description", "type", "price", "currency", "iconUrl", "effect", "duration", "isActive", "sortOrder", "createdAt")
VALUES (
  'item_boost_exp', '經驗加速卡', '獲得雙倍經驗值，快速升級！適合想衝等級的你。', 'BOOST', 200, 'COINS',
  '/images/shop/exp-boost.png', '雙倍經驗 12 小時', 12, true, 3, NOW()
);

-- 新手勳章 (BADGE)
INSERT INTO "shop_items" ("id", "name", "description", "type", "price", "currency", "iconUrl", "effect", "duration", "isActive", "sortOrder", "createdAt")
VALUES (
  'item_badge_newbie', '新手勳章', '象徵你正式踏入 JKForum 的第一步，展示在個人檔案上吧！', 'BADGE', 100, 'COINS',
  '/images/shop/badge-newbie.png', '個人檔案顯示新手勳章', NULL, true, 10, NOW()
);

-- 活躍勳章 (BADGE)
INSERT INTO "shop_items" ("id", "name", "description", "type", "price", "currency", "iconUrl", "effect", "duration", "isActive", "sortOrder", "createdAt")
VALUES (
  'item_badge_active', '活躍勳章', '證明你是社區的活躍成員！限量販售的珍稀勳章。', 'BADGE', 50, 'PLATINUM',
  '/images/shop/badge-active.png', '個人檔案顯示活躍勳章', NULL, true, 11, NOW()
);

-- VIP 勳章 (BADGE)
INSERT INTO "shop_items" ("id", "name", "description", "type", "price", "currency", "iconUrl", "effect", "duration", "isActive", "sortOrder", "createdAt")
VALUES (
  'item_badge_vip', 'VIP 勳章', '尊貴的 VIP 專屬勳章，彰顯你的身份地位。', 'BADGE', 100, 'PLATINUM',
  '/images/shop/badge-vip.png', '個人檔案顯示 VIP 專屬勳章', NULL, true, 12, NOW()
);

-- ============================================================
-- 任務 (9 tasks: 3 newbie + 3 daily + 3 achievement)
-- ============================================================

-- 新手任務 1: 完善個人資料
INSERT INTO "tasks" ("id", "name", "description", "type", "target", "rewardCoins", "rewardReputation", "rewardGems", "badgeId", "iconUrl", "isActive", "sortOrder", "createdAt")
VALUES (
  'task_newbie_profile', '完善個人資料', '設定你的頭像、暱稱和個人簡介，讓其他人認識你！', 'NEWBIE', 1, 100, 10, 0,
  NULL, '/images/tasks/profile.png', true, 1, NOW()
);

-- 新手任務 2: 發表第一篇文章
INSERT INTO "tasks" ("id", "name", "description", "type", "target", "rewardCoins", "rewardReputation", "rewardGems", "badgeId", "iconUrl", "isActive", "sortOrder", "createdAt")
VALUES (
  'task_newbie_first_post', '發表第一篇文章', '在任意看板發表你的第一篇文章，開始你的論壇之旅！', 'NEWBIE', 1, 200, 20, 0,
  'item_badge_newbie', '/images/tasks/first-post.png', true, 2, NOW()
);

-- 新手任務 3: 第一次回覆
INSERT INTO "tasks" ("id", "name", "description", "type", "target", "rewardCoins", "rewardReputation", "rewardGems", "badgeId", "iconUrl", "isActive", "sortOrder", "createdAt")
VALUES (
  'task_newbie_first_reply', '發表第一則回覆', '在任意文章下方留下你的第一則回覆，參與討論！', 'NEWBIE', 1, 100, 10, 0,
  NULL, '/images/tasks/first-reply.png', true, 3, NOW()
);

-- 日常任務 1: 每日簽到
INSERT INTO "tasks" ("id", "name", "description", "type", "target", "rewardCoins", "rewardReputation", "rewardGems", "badgeId", "iconUrl", "isActive", "sortOrder", "createdAt")
VALUES (
  'task_daily_checkin', '每日簽到', '完成今日簽到，領取獎勵！', 'DAILY', 1, 50, 5, 0,
  NULL, '/images/tasks/checkin.png', true, 10, NOW()
);

-- 日常任務 2: 發表文章
INSERT INTO "tasks" ("id", "name", "description", "type", "target", "rewardCoins", "rewardReputation", "rewardGems", "badgeId", "iconUrl", "isActive", "sortOrder", "createdAt")
VALUES (
  'task_daily_post', '每日發文', '今天發表 1 篇文章，分享你的想法！', 'DAILY', 1, 80, 10, 0,
  NULL, '/images/tasks/daily-post.png', true, 11, NOW()
);

-- 日常任務 3: 回覆 3 則
INSERT INTO "tasks" ("id", "name", "description", "type", "target", "rewardCoins", "rewardReputation", "rewardGems", "badgeId", "iconUrl", "isActive", "sortOrder", "createdAt")
VALUES (
  'task_daily_reply', '活躍回覆', '今天回覆 3 則文章，和大家互動吧！', 'DAILY', 3, 60, 5, 0,
  NULL, '/images/tasks/daily-reply.png', true, 12, NOW()
);

-- 成就任務 1: 發表 100 篇文章
INSERT INTO "tasks" ("id", "name", "description", "type", "target", "rewardCoins", "rewardReputation", "rewardGems", "badgeId", "iconUrl", "isActive", "sortOrder", "createdAt")
VALUES (
  'task_achievement_100_posts', '百篇達人', '累計發表 100 篇文章，你是論壇的內容創作者！', 'ACHIEVEMENT', 100, 1000, 100, 5,
  'item_badge_active', '/images/tasks/100-posts.png', true, 20, NOW()
);

-- 成就任務 2: 獲得 500 讚
INSERT INTO "tasks" ("id", "name", "description", "type", "target", "rewardCoins", "rewardReputation", "rewardGems", "badgeId", "iconUrl", "isActive", "sortOrder", "createdAt")
VALUES (
  'task_achievement_500_likes', '人氣之星', '累計獲得 500 個讚，你的內容深受大家喜愛！', 'ACHIEVEMENT', 500, 800, 80, 3,
  NULL, '/images/tasks/500-likes.png', true, 21, NOW()
);

-- 成就任務 3: 連續簽到 30 天
INSERT INTO "tasks" ("id", "name", "description", "type", "target", "rewardCoins", "rewardReputation", "rewardGems", "badgeId", "iconUrl", "isActive", "sortOrder", "createdAt")
VALUES (
  'task_achievement_30_streak', '堅持不懈', '連續簽到 30 天，展現你的毅力！', 'ACHIEVEMENT', 30, 500, 50, 2,
  NULL, '/images/tasks/30-streak.png', true, 22, NOW()
);
