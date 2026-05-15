# 🎬 JKForum 完整 DEMO 手冊（全角色全功能）

**最後更新**：2026-05-12
**生產環境**：https://jkforum.vercel.app
**文件用途**：客戶 demo 一站式參考，依序看完即可掌握全部功能

---

## 📋 目錄

1. [Demo 帳號速查表](#demo-帳號速查表)
2. [Demo 前 30 秒檢查](#demo-前-30-秒檢查)
3. [角色 A：訪客 / 一般會員](#角色-a訪客--一般會員)
4. [角色 B：VIP 會員](#角色-bvip-會員)
5. [角色 C：版主 Moderator](#角色-c版主-moderator)
6. [角色 D：業者 Business](#角色-d業者-business)
7. [角色 E：管理員 Admin](#角色-e管理員-admin)
8. [核心商業模型](#核心商業模型)
9. [Game Loop（遊戲化引擎）](#game-loop遊戲化引擎)
10. [已埋好的 Demo 資料](#已埋好的-demo-資料)
11. [客戶 FAQ 預備](#客戶-faq-預備)

---

## Demo 帳號速查表

> 登入頁 https://jkforum.vercel.app/login 右下角有 6 顆**一鍵快速登入**按鈕

| 角色 | 一鍵登入按鈕 | Email | 密碼 |
|---|---|---|---|
| 🛡️ 管理員 | 有 | admin@jkforum.com | Admin123! |
| 🛠️ 版主 | 有 | moderator_a@jkforum.test | Test123! |
| ✍️ 駐站編輯 | 有 | editor_a@jkforum.test | Test123! |
| 💎 VIP 會員 | 有 | vip_member@jkforum.test | Test123! |
| 👑 資深會員 | 有 | sage_old@jkforum.test | Test123! |
| 🌱 新手會員 | 有 | newbie_a@jkforum.test | Test123! |
| 🏪 業者（手動登入）| 無 | **business_demo@jkforum.test** | Test123! |

**重要附加帳號**（用搜尋或頭像點進去）：
- moderator_b（版主第二人）→ 被指派到 網路美女 / 女神寫真 / 模特兒 三版
- moderator_a（版主第一人）→ 被指派到 女神焦點 / 男人玩物 / 兩性生活 三版
- gamer_jay / foodie_mei / book_worm — 已頒 vip-platinum 勳章（用來示範代表勳章 + 認證徽章）

**萬用憑證**：
- OTP 簡訊驗證碼：**`123456`**（任何手機號都可過）
- 折扣碼：**`WELCOME500`**（充 1000 送 500）

---

## Demo 前 30 秒檢查

```bash
cd E:/JKForum/jkforum
npx tsx scripts/demo-prep.ts        # 重置 admin 體力 + newbie_a 等級
```

**已執行過今天**：✅ admin 體力 200 / 愛心 999999 / 金幣 9999999 / 寶石 9999、newbie_a 重置 PEASANT、R-18 平台開關開啟、gamer_jay/foodie_mei/book_worm 已頒 vip-platinum

**瀏覽器準備**：
- 桌面 Chrome：開三個分頁（未登入、admin 登入、業者登入）
- 手機：加入主畫面 PWA（demo 推播 + 行動優化用）

---

## 角色 A：訪客 / 一般會員

### A1. 首頁巡禮（90 秒）

URL: `https://jkforum.vercel.app/`

依序往下捲，邊捲邊講：

1. **Hero 輪播 4 張** — 業者花 NT$3,000 / 7 天買的位置
2. **2 個促銷 Banner**
3. **10 顆圓形 icon 快捷列**（熱門/最新/聊天/遊戲/日誌/簽到/任務/排行/商城/VIP）
4. **JKF 女郎橫向專欄**（對標 JKF.net 招牌欄）
5. **Focus-Choice 主題精選 + Focus-News 新聞時事**
6. **熱門文章** + **最新文章**

> 💡 講重點：「首頁紅色高亮的就是『全站熱門推 24h』NT$5,000，橘色是 Hero 7 天」

### A2. 看板列表（30 秒）

URL: `/forums`

「**16 大類 / 55 個子版**，跟 JKF 結構一致」

### A3. 文章詳細頁（90 秒）

點熱門文章任一篇

- TipTap 富文本編輯（粗體/斜體/H2/列表/引用/連結/插入圖/插入影片）
- 右下方 5 顆星評分 widget
- 巢狀回覆樓層
- **打賞按鈕** — 80% 給作者
- 結構化資料 JSON-LD（Google 可解析）

### A4. 站家總覽（業者刊登平台主菜，2 分鐘）⭐

URL: `/listing`

**核心展示點**：
- 14 個業者廣告，**5 個 Tier 排序明確**：
  - T3000（NT$3,000）→ T2000 → T1000 → T500 → FREE
- ✓ 綠勾「認證業者」徽章（merchantVerified=true）
- 點上方版區「**按摩**」→ **進階篩選自動跳出**（價位 / 服務類別 / 外型 / 身高體重）
- 點任一廣告進詳情頁：
  - 多圖輪播（最多 8 張）
  - 標籤、價位區間
  - **業者留言區** + **5 顆星評分**
  - 收藏 / 分享 / 聯繫業者

> 💡 主推商家是 **蝶舞舒壓**（3 個廣告 T3000/T2000/T1000，分別在信義/大安/中山）

### A5. 註冊（30 秒）

URL: `/register`

兩條路徑：
- **Email 註冊**（傳統）
- **OTP 純電話註冊**（無需 email，輸入手機 → 收 SMS → 驗證 → 設密碼）

> SMS 萬用碼 `123456`（Twilio 沒接，用 mock）

---

## 角色 B：VIP 會員

點🔵💎 **VIP 會員** 一鍵登入

### B1. VIP 專屬頁

URL: `/vip`

- 會員方案：MONTHLY / QUARTERLY / YEARLY
- 月卡價 NT$199 → 季卡 NT$549 → 年卡 NT$1,999
- VIP 福利：每月 2 張「版內置頂 7 天」voucher、100 金幣/天簽到加成、專屬勳章

### B2. 個人空間（vip_member 帶 VIP 訂閱中）

URL: `/profile/{userId}`

- 勳章牆 / 道具陳列
- 代表勳章顯示在頭像旁
- 認證徽章（VIP 專屬頭框）

### B3. 商店

URL: `/shop`

- 寶石 / 金幣 / 道具 / 頭框 / 勳章 上架
- 道具搭配遊戲中心使用

---

## 角色 C：版主 Moderator

點🔵🛠️ **版主** 一鍵登入（moderator_a）

> moderator_a 被指派的版區：**女神焦點 / 男人玩物 / 兩性生活**
> moderator_b 被指派的版區：**網路美女 / 女神寫真 / 模特兒**

### C1. 版主後台

URL: `/moderator`

子頁：
- `/moderator/forums` — 我管的版區列表
- `/moderator/posts` — 待處理文章（檢舉/送審）
- `/moderator/replies` — 待處理回覆
- `/moderator/reports` — 收到的檢舉

### C2. 版主操作展示

進「女神焦點」版區：
- **置頂**：點任一文章 → 「置頂此貼」（無需付費，版主特權）
- **鎖文**：禁止再回覆
- **移文**：搬到其他版區
- **刪除**：軟刪，可 admin 救回
- **警告會員**：發系統通知

> 💡 講重點：「版主是**沒有費用**就能置頂的，**站長/管理員**也可以；**一般會員**才需要走付費置頂或用 voucher」

---

## 角色 D：業者 Business

> ⚠️ 沒有 quick login 按鈕，要手動輸入 → **business_demo@jkforum.test / Test123!**

### D1. 業者後台首頁

URL: `/business`

- 廣告數、本月儲值額、本月扣款額、待審廣告
- 摘要圖表

### D2. 我的廣告

URL: `/business/ads`

業者已有 **3 個廣告**：
1. **【蝶舞舒壓】台北東區 / 頂級SPA**（T3000，信義區）
2. **【蝶舞舒壓】信義區分店 / 預約制**（T2000，大安區）
3. **【蝶舞舒壓】中山店 / 24h 營業**（T1000，中山區）

每個廣告卡片操作：
- ✏️ 編輯
- 📋 一鍵重新上架（過期後 1 鍵 relaunch）
- 🔁 複製此廣告（複製為 DRAFT）
- ⏰ 排程上架（scheduledAt datetime-local）
- 📊 查看數據（點擊/瀏覽/收藏/聯繫）
- 🗑️ 下架

### D3. 新刊登廣告（核心 Demo 點）⭐

URL: `/business/ads/new`

**演示流程**：
1. 選版區 → **「按摩」** → 進階屬性 input 自動跳出（外型 / 服務類別 / 身高體重 / 價位帶）
2. 輸入標題、描述、選擇縣市/區
3. 設價位區間
4. **多圖上傳**（最多 8 張、5MB / 張、可拖拉排序）
5. 標籤
6. **選 Tier**（FREE / T500 / T1000 / T2000 / T3000）→ 顯示扣款金額
7. 「扣款並送審 NT$3,000」→ 進入待審狀態（admin 那邊看得到）

### D4. 業者錢包儲值

URL: `/business/wallet`

業者已有：**餘額 NT$25,000 / 累積儲值 NT$30,000 / 累積花費 NT$5,000**

演示：
- 選方案：NT$1,000 / 5,000 / 10,000 / 20,000
- 輸入折扣碼 `WELCOME500` → 顯示「充 1,000 送 500」加碼
- **三個付款管道按鈕**：綠界 / 藍新 / Stripe
- 點下去 → 跳到 `/checkout/mock?orderId=...&kind=wallet` 假成交頁
- ⚠️ 客戶要懂這是 mock，等 ECPay 沙盒憑證才真接

**交易紀錄**已 seed 6 筆（DEPOSIT 3 筆 + AD_PAYMENT 3 筆）

### D5. 業者提現

URL: `/business/withdraw`

申請從錢包餘額提現到銀行帳戶 → admin 審核 → 撥款

### D6. 業者數據分析

URL: `/business/analytics`

- 廣告曝光 / 點擊 / 收藏 / 聯繫趨勢圖
- 各 tier 投資報酬率

### D7. 業者廣告評分

URL: `/business/ratings`

- 看消費者評分
- 業者可回評（回覆評論）

---

## 角色 E：管理員 Admin

點🔵🛡️ **管理員** 一鍵登入（資源已 RESET）

### E1. 後台儀表板

URL: `/admin`

- 8 卡：總會員 / 新註冊 / 活躍 / 文章 / 回覆 / VIP / 業者 / 待辦
- 4 條趨勢圖：註冊 / 文章 / 收益 / 業者儲值
- **18 層會員分布**（橫向長條）
- **業者營運 section**：30 天儲值總額 / 廣告總數 / 待審 / KYC / 提現待辦

### E2. 業者廣告審核

URL: `/admin/business-ads`

- 3 個 tab：待審 / 已上架 / 已退件
- 審核操作：**通過** / **退件（要寫退件原因）**
- 通過 → 自動進 `/listing` 列表

### E3. 業者 KYC 審核

URL: `/admin/business-kyc`

- 業者上傳：身分證正反面 / 營業登記
- admin 審核 → 過 → `merchantVerified = true` → 列表 ✓ 綠勾

### E4. 推廣訂單管理

URL: `/admin/promotions`

**已 seed 22 筆訂單**：
- ACTIVE：14 筆（COINS / ECPAY / NEWEBPAY / STRIPE / ADMIN_GIFT 五種付款方式都有）
- EXPIRED：8 筆（歷史紀錄）
- 6 種類型：FORUM_PIN_24H / FORUM_PIN_7D / CATEGORY_PIN_3D / HOME_FEATURED_7D / HOME_HERO_7D / HOT_TOP_24H

### E5. 敏感詞庫

URL: `/admin/banned-words`

- CRUD 介面
- 5 分鐘 cache，新增刪除自動 invalidate
- 影響：post / blog / comment / business ad 自動過濾

### E6. 折扣碼管理

URL: `/admin/coupons`

三型：
- **PERCENT** — 例：8 折
- **FIXED** — 例：折抵 NT$500
- **BONUS** — 例：充 1000 送 500（`WELCOME500` 就是這型）

CouponRedemption 唯一性偵測（同人同碼不能用第二次）

### E7. 用戶管理

URL: `/admin/users`

- **分群下拉**：7 天新註冊 / 週活躍 / 30 天未登入 / 業者 / 已認證業者 / 未驗證
- **批量操作**（checkbox + 浮動工具列）：批量封禁 / 解禁 / 通知
- 一次處理上限 200 筆

### E8. 用戶詳情

URL: `/admin/users/{userId}`

- 個人資料、會員組、權限
- 行為紀錄、登入 IP 史
- 手動加減金幣 / 體力 / 寶石
- 頒勳章

### E9. 站長置頂（任意文章 admin 可手動置頂）

URL: `/admin/posts/{postId}/edit` 或 直接點「置頂」按鈕

### E10. IP 風控

URL: `/admin/users` 內附帶 — 共用 IP 警示 + 多帳號偵測

### E11. 後台日誌

URL: `/admin/logs`

- 11 個 admin route 全有 logAdminAction
- 業者類 action 走 SETTINGS_CHANGE + [PREFIX] 前綴

### E12. 提現審核

URL: `/admin/withdrawals`

- 業者提現申請列表
- 通過 / 駁回（駁回會解凍 frozenBalance）

---

## 核心商業模型

### 自助廣告 / 置頂 6 方案

| 方案 | 金幣 | TWD | 時長 | 範圍 |
|---|---|---|---|---|
| 版內置頂 24h | 100 | 30 | 1 天 | 該版頂部 |
| 版內置頂 7d | 500 | 150 | 7 天 | 該版頂部 |
| 大分類置頂 3d | 2,500 | 1,000 | 3 天 | category 全版 |
| 首頁精華 7d | 2,000 | 500 | 7 天 | 首頁精華區 |
| 首頁 Hero 7d | 12,000 | 3,000 | 7 天 | 4 張 hero 之一 |
| 全站熱門推 24h | 20,000 | 5,000 | 1 天 | 首頁熱門第 1 |

### 業者廣告 5 級

| Tier | 月費 NT$ | 排序權重 |
|---|---|---|
| FREE | 0 | 最低 |
| T500 | 500 | 1 |
| T1000 | 1,000 | 2 |
| T2000 | 2,000 | 3 |
| T3000 | 3,000 | 最高 |

### Voucher（置頂卡）獲得來源

- 連續簽到 30 天 → 1 張 FORUM_PIN_24H
- 完成主題達人任務 → 1 張 HOME_FEATURED_7D
- VIP 月卡 → 每月 2 張 FORUM_PIN_7D
- 推廣 5 個新會員 → 1 張 FORUM_PIN_24H
- 充值送（買 1000 金幣）→ 1 張卡

> Admin 帳號目前有 **5 張未使用 voucher**（給你 demo 兌換流程）

---

## Game Loop（遊戲化引擎）

```
獲得 → 累積 → 兌換 → 展示 → 賺更多
```

| 來源 | 獲得 | 用途 |
|---|---|---|
| 簽到 | 30 金幣 + 5 體力 | 挖礦 / 開寶箱 / 買道具 |
| 發文 / 被讚 | 名聲 + 金幣 | 升等（讀權限）/ 發隱藏帖 |
| 任務 | 100-500 金幣 + 名聲 + **置頂卡** | 廣告位 |
| 推廣（拉新）| 200 金幣 + 邀請額度 + **置頂卡** | game center + 商業 |
| 挖礦 / 合成 | 道具 | **賣回金幣 50%** / 合成更高階 / **送好友** |
| 拿勳章 | 名聲 + 代表勳章 slot | profile 頭像旁顯示 |
| VIP 訂閱 | 每月置頂卡 + 100 金幣/天 | 三邊連動 |

### 遊戲中心 demo

URL: `/achieve/game`

5 種玩法：
- `/achieve/game/mine` — 挖礦
- `/achieve/game/explore` — 探索
- `/achieve/game/treasure` — 寶箱
- `/achieve/game/store` — 道具商店
- `/achieve/game/craft` — 道具合成
- `/achieve/game/medal-craft` — 勳章合成
- `/achieve/game/inventory` — 我的道具庫存（**賣回 50% 金幣** / 送好友）

> 53 個道具 + 7 配方 + 44 勳章

---

## 已埋好的 Demo 資料

| 區塊 | 數量 | 說明 |
|---|---|---|
| 假用戶 | 30 個 | 覆蓋 18 層會員組 |
| 文章 | 559 篇 | 含 90 篇 R-18 |
| 回覆 | 1,234 個 | |
| 讚 | 2,387 個 | |
| 收藏 | 467 個 | |
| 勳章 | 44 個 / 持有 182 | |
| 聊天訊息 | 186 個 | |
| 個人日誌 | 16 篇 | |
| 投票 | 5 個 | |
| 評分 | 241 個 | |
| 打賞 | 38 筆 | |
| 好友 | 30 對 | |
| 追蹤 | 46 個 | |
| 簽到 | 124 次 | |
| 道具庫存 | 79 個 | |
| **業者廣告** | **14 個 + 蝶舞舒壓 3 個 = 17 個** | 5 個 Tier 全有 |
| **版內置頂貼** | **55 篇** | 每版區 1-2 篇 |
| **大分類置頂** | **3 篇** | |
| **首頁精華** | **5 篇** | |
| **首頁 Hero**（橘色高亮）| **4 篇** | |
| **全站熱門推**（紅色高亮）| **2 篇** | |
| **推廣訂單** | **22 筆**（14 ACTIVE + 8 EXPIRED）| 5 種付款方式都有 |
| **置頂卡 voucher** | **admin 持有 5 張**（任務/簽到/VIP/推廣/充值來源齊全）| |
| **VIP 訂閱** | **2 個**（admin + vip_member）| |
| **版主指派** | **6 筆**（mod_a 3 版 + mod_b 3 版）| |
| **業者錢包交易** | **6 筆** | DEPOSIT + AD_PAYMENT |
| **付費版區** | **5 個**（按摩/酒店/魚訊/個工/好茶）| |

---

## 客戶 FAQ 預備

### Q1：「Tier 階層能我自己改嗎？」
A：目前 5 階寫死（FREE / T500 / T1000 / T2000 / T3000）。**下一階段加後台可設定**（自訂方案數 / 價格 / 排序權重 / 限時促銷價）— 約 1.5-2 小時開發。

### Q2：「真的金流通了嗎？」
A：綠界 / 藍新 / Stripe 三按鈕在頁面上會跳到 `/checkout/mock` 假成交頁。schema 與 webhook 流程已就位，**等你提供 ECPay 沙盒憑證即可上線**。

### Q3：「SMS 真的會發嗎？」
A：架構已就位，需要你提供 **Twilio** 憑證即可發。Demo 萬用碼 `123456` 過任何手機。

### Q4：「Email 驗證信能發嗎？」
A：`emailVerified` 欄已有 + `email_tokens` 表已建，UI 流程**未串完**（V1.2）。

### Q5：「能上架到 App Store / Google Play？」
A：目前是 **PWA**（已支援加入主畫面 + 推播）。原生 App **是 V1.2 範疇**，需要 React Native / Flutter 重包。

### Q6：「直播 / 影片功能呢？」
A：富文本支援嵌入 YouTube / mp4。**真實串流（Mux / CF Stream）**屬於 V1.2，需另外開發 + 月費。

### Q7：「Domain 切到客戶自己的？」
A：Vercel 後台改 custom domain 即可，10 分鐘搞定。

### Q8：「能多租戶 SaaS 給多客戶？」
A：架構已支援 tenant 概念但**已決策延後**。建議先穩這版，第二客戶談時再開（避免過度工程）。

### Q9：「資料能備份 / 匯出嗎？」
A：Supabase 自動每日備份，admin 可從 dashboard 觸發 SQL dump。**自助匯出 UI** 未做（V1.2）。

### Q10：「用了哪些 AI 工具？」
A：
- Claude Code（主要開發 agent）
- Vercel（部署 + Analytics）
- Supabase（DB + Auth + Storage）
- Tiptap（富文本編輯）
- Next.js 14 App Router

---

## 🎯 30 分鐘 Demo 黃金路線（總長）

```
P1 訪客體驗（5 min）
   首頁 → 看板 → 文章詳細 → /listing 業者廣告

P2 業者刊登平台（10 min）⭐ 主菜
   listing 排序 + 進階篩選
   → ad 詳情多圖+留言+評分
   → 切 business_demo
   → 後台 + 我的廣告
   → 新刊登（選版區、進階屬性、多圖、Tier、扣款）
   → 錢包儲值（折扣碼 + 三付款管道）

P3 站內推廣置頂（5 min）
   切回 admin
   → 任一文章 → 推廣置頂
   → 看 6 種方案
   → 看 5 張 voucher 可兌換
   → 兌換後文章馬上 Hero 高亮

P4 Admin 後台（8 min）
   /admin 儀表板 8 卡
   → /admin/business-ads 審核
   → /admin/promotions 22 筆訂單
   → /admin/users 分群 + 批量
   → /admin/coupons 折扣碼
   → /admin/banned-words 敏感詞

P5 版主功能（2 min）
   切 moderator_a
   → /moderator 後台
   → 進「女神焦點」置頂 / 鎖文
```

---

## 📞 重要 URL 一覽

| 頁面 | URL |
|---|---|
| 首頁 | https://jkforum.vercel.app |
| 看板總覽 | /forums |
| 業者廣告 listing | /listing |
| 廣告詳情 | /listing/ad/{id} |
| 業者主頁 | /business |
| 新刊登 | /business/ads/new |
| 業者錢包 | /business/wallet |
| Admin | /admin |
| 推廣訂單 | /admin/promotions |
| 業者廣告審核 | /admin/business-ads |
| 業者 KYC | /admin/business-kyc |
| 折扣碼 | /admin/coupons |
| 敏感詞 | /admin/banned-words |
| 用戶管理 | /admin/users |
| 版主後台 | /moderator |
| 推廣置頂任一文 | /promote/{postId} |
| 個人空間 | /profile/{userId} |
| 遊戲中心 | /achieve/game |
| VIP | /vip |
| 商城 | /shop |
| 任務 | /tasks |
| 簽到 | /checkin |

---

**Production**：https://jkforum.vercel.app
**最新 commit**：`6be28a6`（feat: G1-G4 — admin 評分審核 + 業者回評 + 通知中心強化）
**Build 狀態**：✅ 綠

衝吧 🚀
