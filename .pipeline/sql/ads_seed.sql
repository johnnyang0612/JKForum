-- 廣告系統種子資料
-- 3 筆範例廣告（各主要位置各一筆）

INSERT INTO "advertisements" (
  "id", "title", "imageUrl", "linkUrl", "position",
  "width", "height", "startDate", "endDate",
  "isActive", "priority", "targetForums",
  "impressions", "clicks", "createdAt", "updatedAt"
) VALUES
(
  'ad_seed_banner_01',
  '春季限時優惠活動',
  'https://placehold.co/1200x300/3b82f6/ffffff?text=Spring+Sale+Banner',
  'https://example.com/spring-sale',
  'HOME_BANNER',
  1200, 300,
  NOW(), NOW() + INTERVAL '90 days',
  true, 10, NULL,
  0, 0, NOW(), NOW()
),
(
  'ad_seed_sidebar_01',
  'VIP 會員專屬福利',
  'https://placehold.co/300x600/8b5cf6/ffffff?text=VIP+Benefits',
  'https://example.com/vip-benefits',
  'SIDEBAR',
  300, 600,
  NOW(), NOW() + INTERVAL '60 days',
  true, 5, NULL,
  0, 0, NOW(), NOW()
),
(
  'ad_seed_inline_01',
  '新品上市搶先看',
  'https://placehold.co/600x400/ef4444/ffffff?text=New+Product+Launch',
  'https://example.com/new-product',
  'POST_INLINE',
  600, 400,
  NOW(), NOW() + INTERVAL '30 days',
  true, 3, NULL,
  0, 0, NOW(), NOW()
);
