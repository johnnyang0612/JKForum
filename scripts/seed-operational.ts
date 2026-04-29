/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 大型運營級 seed — 讓 JKForum 看起來像一個正在營運的論壇
 *
 * 包含：
 * - 30 個假用戶（覆蓋 18 層會員組光譜）+ 頭像 + 封面
 * - 30+ JKF 風格勳章 + 大量發放
 * - 250+ 文章橫跨所有 forums，配封面/標籤/瀏覽/讚/收藏
 * - 800+ 回覆
 * - 30 篇個人日誌
 * - 200 則聊天室訊息散到所有 room
 * - 5 個投票帖
 * - 100+ 文章評分
 * - 友誼/追蹤/打賞/簽到 互動 graph
 * - 給 5 個用戶遊戲道具庫存
 *
 * 冪等：所有 upsert by slug/email/id；每次跑都安全。
 */
import {
  PrismaClient,
  UserRole,
  UserStatus,
  UserGroup,
  PostStatus,
  PostVisibility,
  ContentRating,
  FriendStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { GROUPS } from "../lib/user-groups";

const db = new PrismaClient();

// ─────────────────────────────────────────────────────────
// 影像來源（公共免費）
// ─────────────────────────────────────────────────────────
const img = (seed: string | number, w = 640, h = 360) =>
  `https://picsum.photos/seed/${encodeURIComponent(String(seed))}/${w}/${h}`;
const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(seed)}&size=200`;

// ─────────────────────────────────────────────────────────
// 假用戶
// ─────────────────────────────────────────────────────────
const FAKE_USERS = [
  { username: "linda_chen",   displayName: "Linda 陳",     bio: "美食 / 旅遊愛好者，三貓奴。", group: "VIP" as const, gender: "female" },
  { username: "kevin_wang",   displayName: "Kevin 王",     bio: "後端工程師，Python / Go 重度使用者。", group: "DUKE" as const, gender: "male" },
  { username: "showgirl_amy", displayName: "Amy",          bio: "ShowGirl / 模特兒 / 瑜伽教練。", group: "VIP" as const, gender: "female" },
  { username: "gamer_jay",    displayName: "電競傑",       bio: "Apex Pred / Valorant Imm / LOL Master。", group: "MARQUIS" as const, gender: "male" },
  { username: "foodie_mei",   displayName: "美食家小美",   bio: "走遍米其林餐廳。", group: "EARL" as const, gender: "female" },
  { username: "movie_buff",   displayName: "電影狂",       bio: "一年看 200 部電影，影評週更。", group: "VISCOUNT" as const, gender: "male" },
  { username: "tech_geek",    displayName: "科技阿宅",     bio: "iPhone / Android / 智慧家電。", group: "BARON" as const, gender: "male" },
  { username: "book_worm",    displayName: "書蟲",         bio: "讀書筆記分享。", group: "KNIGHT" as const, gender: "female" },
  { username: "fit_guy",      displayName: "健身阿凱",     bio: "三鐵教練 / 健美業餘冠軍。", group: "EARL" as const, gender: "male" },
  { username: "music_lover",  displayName: "音樂瓶子",     bio: "獨立樂團主唱。", group: "SQUIRE" as const, gender: "female" },
  { username: "comic_fan",    displayName: "漫畫宅",       bio: "JUMP / 講談社全買。", group: "SQUIRE" as const, gender: "male" },
  { username: "investor",     displayName: "金融老鳥",     bio: "20 年股市經驗，分享觀點不報明牌。", group: "PRINCE" as const, gender: "male" },
  { username: "auntie",       displayName: "婆媳專家",     bio: "靠北專業戶。", group: "KNIGHT" as const, gender: "female" },
  { username: "traveler",     displayName: "背包客阿德",   bio: "去過 53 國，拍照不修圖。", group: "EARL" as const, gender: "male" },
  { username: "chef_tang",    displayName: "唐師傅",       bio: "私廚 / 烹飪老師。", group: "VIP" as const, gender: "male" },
  { username: "couple_diary", displayName: "情感顧問",     bio: "婚姻諮商師，幫你解決感情難題。", group: "MARQUIS" as const, gender: "female" },
  { username: "car_lover",    displayName: "車界小編",     bio: "雙 B / Tesla / 改裝。", group: "BARON" as const, gender: "male" },
  { username: "anime_otaku",  displayName: "動畫廚",       bio: "新番派 / 季度推薦。", group: "SQUIRE" as const, gender: "male" },
  { username: "ig_beauty",    displayName: "IG 寫真",      bio: "貼圖區常駐。", group: "VIP" as const, gender: "female" },
  { username: "code_ninja",   displayName: "程式忍者",     bio: "Rust / TypeScript / WebAssembly。", group: "DUKE" as const, gender: "male" },
  { username: "moderator_a",  displayName: "閒聊版版主",   bio: "閒聊版版主，不歡迎廣告。", group: "MODERATOR_GRP" as const, gender: "male" },
  { username: "moderator_b",  displayName: "3C版版主",    bio: "3C 版版主，業界 10 年。", group: "MODERATOR_GRP" as const, gender: "male" },
  { username: "editor_a",     displayName: "駐站編輯阿芸", bio: "JKF 駐站編輯。", group: "EDITOR" as const, gender: "female" },
  { username: "editor_b",     displayName: "駐站編輯小傑", bio: "JKF 駐站編輯，影視專欄。", group: "EDITOR" as const, gender: "male" },
  { username: "newbie_a",     displayName: "新手小白",     bio: "剛加入，請多指教。", group: "PEASANT" as const, gender: "male" },
  { username: "newbie_b",     displayName: "報到專員",     bio: "什麼都看，不太發文。", group: "PEASANT" as const, gender: "female" },
  { username: "sage_old",     displayName: "資深前輩",     bio: "JKF 5 年資深會員。", group: "EMPEROR" as const, gender: "male" },
  { username: "god_user",     displayName: "傳說神祇",     bio: "頂層會員，發文若干。", group: "GOD" as const, gender: "male" },
  { username: "vip_member",   displayName: "VIP 會員",     bio: "白金 VIP，享受所有專屬權益。", group: "VIP" as const, gender: "female" },
  { username: "explorer",     displayName: "探客體驗者",   bio: "嘗鮮達人。", group: "VISCOUNT" as const, gender: "male" },
];

// ─────────────────────────────────────────────────────────
// 額外勳章（補到 30+）
// ─────────────────────────────────────────────────────────
const EXTRA_MEDALS = [
  { slug: "vip-platinum",   name: "白金貴賓",     description: "VIP 訂閱用戶專屬",     iconEmoji: "💎", tier: "platinum", category: "vip" },
  { slug: "love-advisor",   name: "愛情顧問",     description: "感情版回答破百次",     iconEmoji: "💕", tier: "gold",     category: "expert" },
  { slug: "tech-master",    name: "科技達人",     description: "3C 版優質發文 50 篇",   iconEmoji: "⚙️", tier: "gold",     category: "expert" },
  { slug: "news-critic",    name: "新聞評論家",   description: "新聞版深度評論 30 篇", iconEmoji: "📰", tier: "silver",   category: "expert" },
  { slug: "trend-leader",   name: "潮流達人",     description: "潮流分享得讚破千",     iconEmoji: "🔥", tier: "gold",     category: "popularity" },
  { slug: "nightlife-pro",  name: "夜店達人",     description: "夜店話題達人",         iconEmoji: "🌃", tier: "silver",   category: "lifestyle" },
  { slug: "good-citizen",   name: "好市民代表",   description: "回報違規優質貢獻",     iconEmoji: "🛡️", tier: "gold",    category: "honor" },
  { slug: "love-medal",     name: "愛心勳章",     description: "送出 1000 顆愛心",     iconEmoji: "❤️",  tier: "silver",  category: "interaction" },
  { slug: "tip-medal",      name: "加分勳章",     description: "幫人加 500 名聲",     iconEmoji: "👍", tier: "silver",   category: "interaction" },
  { slug: "reply-master",   name: "回覆達人",     description: "回覆 1000 次",         iconEmoji: "💬", tier: "gold",     category: "activity" },
  { slug: "whirlwind",      name: "旋風快手",     description: "1 分鐘內回覆 5 篇",   iconEmoji: "🌪️", tier: "bronze",  category: "speed" },
  { slug: "speed-wind",     name: "疾風快手",     description: "回覆速度神級",         iconEmoji: "⚡", tier: "silver",   category: "speed" },
  { slug: "storm-wind",     name: "狂風快手",     description: "10 分鐘內回覆 30 篇",  iconEmoji: "🌀", tier: "gold",     category: "speed" },
  { slug: "thunder-god",    name: "暴風神手",     description: "回覆速度傳說等級",     iconEmoji: "⛈️", tier: "platinum", category: "speed" },
  { slug: "site-editor",    name: "駐站編輯",     description: "JKF 認證駐站編輯",     iconEmoji: "✏️", tier: "gold",    category: "title" },
  { slug: "moderator-mark", name: "版主",         description: "JKF 認證版主",         iconEmoji: "🛠️", tier: "gold",    category: "title" },
  { slug: "super-mod",      name: "超級版主",     description: "管轄多版的超級版主",   iconEmoji: "🔧", tier: "platinum", category: "title" },
  { slug: "deputy-admin",   name: "副站長",       description: "JKF 副站長",           iconEmoji: "🎯", tier: "platinum", category: "title" },
  { slug: "anniversary-4",  name: "四週年紀念",   description: "JKF 4 週年活動勳章",  iconEmoji: "🎂", tier: "limited",  category: "event" },
  { slug: "great-helper",   name: "超級好幫手",   description: "幫助新手達 100 次",   iconEmoji: "🤝", tier: "gold",     category: "honor" },
  { slug: "high-helper",    name: "高級好幫手",   description: "幫助新手達 50 次",    iconEmoji: "🤲", tier: "silver",   category: "honor" },
  { slug: "helper",         name: "好幫手",       description: "幫助新手達 10 次",    iconEmoji: "🙋", tier: "bronze",   category: "honor" },
  { slug: "gold-box",       name: "金牌盒子",     description: "高階寶箱合成獎勵",     iconEmoji: "🥇", tier: "gold",     category: "synth" },
  { slug: "silver-box",     name: "銀牌盒子",     description: "中階寶箱合成獎勵",     iconEmoji: "🥈", tier: "silver",   category: "synth" },
  { slug: "bronze-box",     name: "銅牌盒子",     description: "初階寶箱合成獎勵",     iconEmoji: "🥉", tier: "bronze",   category: "synth" },
  { slug: "achievement-medal-mid",   name: "中階成就勳章", description: "由銅勳章合成", iconEmoji: "🏆", tier: "silver",   category: "synth" },
  { slug: "achievement-medal-large", name: "大型成就勳章", description: "由銀勳章合成", iconEmoji: "🏅", tier: "platinum", category: "synth" },
];

// ─────────────────────────────────────────────────────────
// 文章標題 / 內文 範例（JKF 風格）
// ─────────────────────────────────────────────────────────
const POST_TEMPLATES: Record<string, Array<{ title: string; tags?: string[] }>> = {
  default: [
    { title: "[討論] 你們覺得 2026 年最值得期待的事是什麼？", tags: ["生活"] },
    { title: "[心情貼] 工作與生活平衡好難…分享你的方法吧", tags: ["心情"] },
    { title: "[發問] 求推薦 — 適合 30 歲族群的興趣？", tags: ["興趣"] },
    { title: "[分享] 我的減壓方式，希望對你也有幫助", tags: ["分享"] },
    { title: "[趣事貼] 今天在便利商店遇到的有趣對話", tags: ["趣事"] },
  ],
  chat: [
    { title: "假如明天是世界末日或是處刑日，你最後一頓飯要吃什麼？", tags: ["假設"] },
    { title: "沒人發現現在「準時下班」變得很像在犯罪嗎？", tags: ["職場"] },
    { title: "👽 救命！外星觀察員發回的「地球實習報告」", tags: ["趣味"] },
    { title: "用交友軟體出去約會「AA制」到底是不是雷？", tags: ["感情"] },
    { title: "[心情貼] 一個人住第三年，分享我的小發現", tags: ["生活"] },
    { title: "[討論] 你會願意為了夢想 3 年內不領薪水嗎？", tags: ["人生"] },
    { title: "[趣事貼] 同事問我借 50 元，3 個月還我 49 元", tags: ["職場"] },
    { title: "你最近做過最後悔的一件小事是什麼？", tags: ["閒聊"] },
  ],
  news: [
    { title: "[新聞] 央行升息半碼！房貸族首當其衝", tags: ["時事"] },
    { title: "[新聞] 蘋果 iOS 27 將取消實體 Home 鍵設計？", tags: ["科技"] },
    { title: "[時事] 麥當勞菜單大改版！這款熱賣品確定下架", tags: ["生活"] },
    { title: "[新聞] 台灣高鐵 2027 將延伸至屏東！", tags: ["交通"] },
    { title: "[時事] 全聯推「AI 自助結帳」實測心得", tags: ["科技"] },
    { title: "[新聞] OpenAI 推出 GPT-6，效能提升 4 倍", tags: ["AI"] },
  ],
  tech: [
    { title: "[分享] 蘋果官方暗示 iOS 27 新介面！達人揭秘", tags: ["iPhone"] },
    { title: "[分享] Sony PS5 買氣大減！日本銷量竟仍不到初代 Switch 一半", tags: ["遊戲機"] },
    { title: "[分享] 三星新一代入門手機升級曝光！告別水滴瀏海", tags: ["Android"] },
    { title: "[分享] LINE 又出包！傳圖、貼圖全掛", tags: ["軟體"] },
    { title: "[評測] M5 Pro 開箱 — 散熱與續航都比上一代強", tags: ["筆電"] },
    { title: "[討論] 機械鍵盤入門推薦，預算 3000 內", tags: ["週邊"] },
    { title: "[分享] 我用 Cursor + Claude Code 一天寫完一個 SaaS", tags: ["AI", "開發"] },
  ],
  food: [
    { title: "[食記] 米其林一星吃到飽？最強 CP 值在這家", tags: ["米其林"] },
    { title: "[食記] 信義區隱藏版日式拉麵，沒訂位吃不到", tags: ["拉麵"] },
    { title: "[食譜] 30 分鐘做出超下飯滷肉，老婆直接打 100 分", tags: ["家常"] },
    { title: "[分享] 全台最強鹽酥雞名單 — 在地人都偷偷吃", tags: ["小吃"] },
  ],
  travel: [
    { title: "[遊記] 北海道 7 天 6 夜行程整理（附預算）", tags: ["日本"] },
    { title: "[分享] 東京自由行省錢攻略 — 機票飯店都不到 2 萬", tags: ["日本"] },
    { title: "[遊記] 京阪奈賞楓全攻略，10 個必去景點", tags: ["日本", "賞楓"] },
    { title: "[遊記] 沖繩潛水 5 日，水下世界太誇張", tags: ["沖繩"] },
  ],
  fitness: [
    { title: "[心得] 半年瘦 12 公斤的飲食計畫公開", tags: ["減重"] },
    { title: "[討論] 居家健身 vs 健身房，CP 值哪個高？", tags: ["健身"] },
    { title: "[分享] 三鐵新手要注意的 5 件事", tags: ["三鐵"] },
  ],
  showgirl: [
    { title: "失控小學妹「梗梗」下課色流連…網直呼可愛", tags: ["美女"] },
    { title: "ShowGirl 安希「H 奶豪邁」現身會場！全場目光炸裂", tags: ["ShowGirl"] },
    { title: "尤物「Mia 米亞」深 V 爆乳寫真！誘惑無極限", tags: ["寫真"] },
    { title: "「美乳溝探索」誰能挪開視線？小秘書翹臀壓腰太誘惑", tags: ["美女"] },
    { title: "亞洲精選美女合輯 — 本週 TOP 10", tags: ["美女"] },
  ],
  comic: [
    { title: "[新番] 2026 春季新番推薦：這 5 部不能錯過", tags: ["新番"] },
    { title: "[討論] 鬼滅之刃完結篇，你給幾分？", tags: ["鬼滅"] },
    { title: "[漫畫] JUMP 連載最新 SPY×FAMILY 雜談", tags: ["JUMP"] },
  ],
  movie: [
    { title: "[影評] 阿凡達 4 — IMAX 體驗心得，畫面爽到不行", tags: ["科幻"] },
    { title: "[討論] 漫威新片票房崩盤，原因是什麼？", tags: ["漫威"] },
    { title: "[推薦] Netflix 最近 5 部高分韓劇", tags: ["韓劇"] },
  ],
  invest: [
    { title: "[討論] 台積電破 1500 是合理還是泡沫？", tags: ["美股", "台積電"] },
    { title: "[分享] 30 歲存到第一桶金的方法（不是教你買股）", tags: ["理財"] },
    { title: "[心得] ETF 0050 vs 006208，新手選哪個？", tags: ["ETF"] },
  ],
  cars: [
    { title: "[開箱] Tesla Model Y 改款試駕：續航終於追上特斯拉自家了", tags: ["Tesla"] },
    { title: "[討論] 雙 B 小型旗艦選 BMW 3 還是 Benz C？", tags: ["雙B"] },
    { title: "[改裝] 我的 GR Yaris 改裝心路歷程", tags: ["改裝"] },
  ],
};

const PARAGRAPH_BANK = [
  "其實這件事我想了很久，覺得有些觀點還是值得分享給大家。",
  "上週末跟朋友聊到這個話題，大家意見都不太一樣，覺得很有趣所以發來討論。",
  "我先說自己的經驗，可能不是普遍狀況，僅供參考。",
  "看完之後真的滿震驚的，整理一下幾個重點：第一點是 ___，第二點是 ___。",
  "如果你也有類似想法，歡迎在底下回覆討論，互相交流。",
  "重點整理在最下面，急的可以直接拉到結論。",
  "本篇純屬個人經驗分享，不構成任何建議，請理性參考。",
  "感謝看到這裡的大家，希望這篇對你有幫助 🙏",
  "我自己最後是選了 A 方案，原因有三：成本、時間、學習曲線。",
  "推薦大家可以試試這個流程，至少對我來說是有效的。",
];

function richContent(title: string, seed: number): string {
  const cover = img(`post-${seed}`);
  const para = (n: number) => PARAGRAPH_BANK[(seed + n) % PARAGRAPH_BANK.length];
  return `<p>${para(0)}</p>
<p><img src="${cover}" alt="${title}" /></p>
<p>${para(1)}</p>
<p>${para(2)}</p>
<h3>幾個觀察</h3>
<ul>
<li>${para(3)}</li>
<li>${para(4)}</li>
<li>${para(5)}</li>
</ul>
<p><img src="${img(`post-${seed}-2`)}" /></p>
<p>${para(6)}</p>
<p>${para(7)}</p>`;
}

const CHAT_MESSAGES = [
  "嗨大家好！今天天氣不錯～",
  "有人在嗎？", "我來簽到 ✋",
  "推薦最近好看的影集",
  "今天又加班了 QQ", "下班！收工！",
  "有人玩星海爭霸 2 嗎？",
  "新手請多多指教 🙇",
  "剛剛挖礦挖到星之原石！",
  "求推薦便宜的機械鍵盤",
  "週末要幹嘛", "晚餐吃什麼好",
  "新番有人追嗎？",
  "今天股市又紅通通", "上班使我快樂",
  "有人去過北海道嗎，有沒有推薦景點",
  "推薦最近好看的書",
  "天氣冷了大家注意保暖", "感冒了 QQ",
  "週年慶好多東西想買",
];

const BLOG_TEMPLATES = [
  { title: "我的第一年遠距工作心得", category: "工作" },
  { title: "日本 14 天自由行行程公開", category: "旅遊" },
  { title: "從 0 開始學程式的一年回顧", category: "學習" },
  { title: "台北 30 間咖啡店巡禮", category: "美食" },
  { title: "30 歲開始健身的一些感想", category: "健康" },
  { title: "為什麼我換掉用了 5 年的 iPhone", category: "3C" },
  { title: "讀完《被討厭的勇氣》的心得", category: "閱讀" },
  { title: "養貓兩年，我學到的事", category: "寵物" },
  { title: "獨居生活的小確幸與痛點", category: "生活" },
  { title: "我推薦的 10 個生產力 App", category: "工具" },
];

// ─────────────────────────────────────────────────────────
// 主程式
// ─────────────────────────────────────────────────────────
async function seedUsers() {
  console.log("👤 建立假用戶...");
  const hash = await bcrypt.hash("Test123!", 10);
  let created = 0;

  for (const u of FAKE_USERS) {
    const groupCfg = GROUPS.find((g) => g.group === u.group)!;
    await db.user.upsert({
      where: { email: `${u.username}@jkforum.test` },
      update: {
        userGroup: u.group as UserGroup,
        readPermission: groupCfg.readPower,
      },
      create: {
        email: `${u.username}@jkforum.test`,
        username: u.username,
        displayName: u.displayName,
        hashedPassword: hash,
        emailVerified: new Date(),
        role:
          (u.group as UserGroup) === "MODERATOR_GRP"
            ? UserRole.MODERATOR
            : (u.group as UserGroup) === "ADMIN_GRP"
            ? UserRole.ADMIN
            : UserRole.USER,
        status: UserStatus.ACTIVE,
        userGroup: u.group as UserGroup,
        readPermission: groupCfg.readPower,
        coverPhotoUrl: img(`cover-${u.username}`, 1200, 400),
        registerIp: `203.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        lastLoginIp: `203.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        lastLoginAt: new Date(Date.now() - Math.random() * 86400000 * 14),
        profile: {
          create: {
            avatarUrl: avatar(u.username),
            bio: u.bio,
            signature: ["努力生活，認真看戲。", "不爭不搶，自有道理。", "Stay hungry, stay foolish.", "活著就是要折騰。"][Math.floor(Math.random() * 4)],
            gender: u.gender,
            isPublic: true,
            postCount: 0,
            replyCount: 0,
            likeCount: 0,
            followerCount: 0,
            followingCount: 0,
          },
        },
        points: {
          create: {
            reputation: Math.floor(Math.random() * 1000) + (groupCfg.reqReputation ?? 100),
            coins: Math.floor(Math.random() * 50000) + 10000,
            platinum: u.group === "VIP" ? Math.floor(Math.random() * 5000) : 0,
            hearts: Math.floor(Math.random() * 50000) + 5000,
            gems: Math.floor(Math.random() * 100),
            given: Math.floor(Math.random() * 200),
            energy: Math.floor(Math.random() * 100) + 50,
            invites: Math.floor(Math.random() * 10),
            totalPoints: Math.floor(Math.random() * 100000),
            level: Math.floor(Math.random() * 18),
          },
        },
      },
    });
    created++;
  }
  console.log(`   ✅ ${created} users seeded`);
}

async function seedExtraMedals() {
  console.log("🏅 補充勳章...");
  for (const m of EXTRA_MEDALS) {
    await db.medal.upsert({
      where: { slug: m.slug },
      update: { name: m.name, description: m.description, iconEmoji: m.iconEmoji, tier: m.tier, category: m.category },
      create: {
        slug: m.slug,
        name: m.name,
        description: m.description,
        iconEmoji: m.iconEmoji,
        tier: m.tier,
        category: m.category,
        ruleType: "manual",
        isAuto: false,
      },
    });
  }
  console.log(`   ✅ ${EXTRA_MEDALS.length} medals upserted`);
}

async function seedPosts() {
  console.log("📝 建立文章...");
  const users = await db.user.findMany({
    where: { email: { endsWith: "@jkforum.test" } },
    select: { id: true, userGroup: true },
  });
  const forums = await db.forum.findMany({
    select: { id: true, slug: true, name: true, rating: true },
  });
  if (users.length === 0 || forums.length === 0) {
    console.warn("   ⚠️  no users or forums to seed");
    return;
  }

  let created = 0;
  let postSeed = 1000;

  for (const forum of forums) {
    // 每版 4-8 篇
    const count = Math.floor(Math.random() * 5) + 4;
    // 取對應主題模板
    const theme =
      POST_TEMPLATES[
        forum.slug.toLowerCase().includes("chat") ? "chat" :
        forum.slug.toLowerCase().includes("news") ? "news" :
        forum.slug.toLowerCase().includes("tech") || forum.slug.includes("3c") ? "tech" :
        forum.slug.toLowerCase().includes("food") ? "food" :
        forum.slug.toLowerCase().includes("travel") ? "travel" :
        forum.slug.toLowerCase().includes("fitness") || forum.slug.includes("sport") ? "fitness" :
        forum.slug.toLowerCase().includes("comic") || forum.slug.toLowerCase().includes("anime") ? "comic" :
        forum.slug.toLowerCase().includes("movie") ? "movie" :
        forum.slug.toLowerCase().includes("invest") || forum.slug.toLowerCase().includes("money") ? "invest" :
        forum.slug.toLowerCase().includes("car") ? "cars" :
        forum.rating === "R18" ? "showgirl" :
        "default"
      ] || POST_TEMPLATES.default;

    for (let i = 0; i < count; i++) {
      const tmpl = theme[(postSeed + i) % theme.length];
      const author = users[(postSeed + i) % users.length];
      postSeed++;
      const slug = `${forum.slug}-seed-${postSeed}-${Date.now().toString(36)}`;
      const created_at = new Date(Date.now() - Math.random() * 30 * 86400000);
      try {
        await db.post.create({
          data: {
            authorId: author.id,
            forumId: forum.id,
            title: tmpl.title,
            content: richContent(tmpl.title, postSeed),
            excerpt: tmpl.title.replace(/\[[^\]]+\]\s*/g, "").slice(0, 200),
            slug,
            status: PostStatus.PUBLISHED,
            visibility: PostVisibility.PUBLIC,
            rating: forum.rating as ContentRating,
            viewCount: Math.floor(Math.random() * 5000) + 100,
            likeCount: Math.floor(Math.random() * 200),
            replyCount: 0,
            favoriteCount: Math.floor(Math.random() * 50),
            ratingAvg: Math.random() > 0.3 ? 3 + Math.random() * 2 : 0,
            ratingCount: Math.random() > 0.3 ? Math.floor(Math.random() * 20) : 0,
            createdAt: created_at,
            lastReplyAt: created_at,
          },
        });
        created++;
      } catch (e: any) {
        // slug collision — skip
      }
    }
  }
  console.log(`   ✅ ${created} posts created across ${forums.length} forums`);
}

async function seedReplies() {
  console.log("💬 建立回覆...");
  const users = await db.user.findMany({
    where: { email: { endsWith: "@jkforum.test" } },
    select: { id: true },
  });
  const posts = await db.post.findMany({
    select: { id: true },
    take: 200,
    orderBy: { createdAt: "desc" },
  });

  const replyTemplates = [
    "推一個！", "寫得很棒，學到了。", "這個我也有同感。", "感謝分享 👍", "+1 大推",
    "有道理，不過我覺得還可以從另一個角度看", "請問有沒有相關的文章可以參考？",
    "最近也在研究這個，謝謝樓主分享心得", "我有不同看法，但還是尊重你的觀點", "蹲一個",
    "卡個位先", "幫高調", "感謝分享！受益良多 🙏", "這篇值得收藏！",
  ];

  let created = 0;
  for (const post of posts) {
    const replyCount = Math.floor(Math.random() * 6) + 2;
    for (let i = 0; i < replyCount; i++) {
      const author = users[Math.floor(Math.random() * users.length)];
      const content = replyTemplates[Math.floor(Math.random() * replyTemplates.length)];
      try {
        await db.reply.create({
          data: {
            postId: post.id,
            authorId: author.id,
            content,
            floor: i + 2,
            likeCount: Math.floor(Math.random() * 20),
            createdAt: new Date(Date.now() - Math.random() * 7 * 86400000),
          },
        });
        created++;
      } catch {}
    }
    await db.post.update({
      where: { id: post.id },
      data: { replyCount: replyCount },
    });
  }
  console.log(`   ✅ ${created} replies created`);
}

async function seedMedalDistribution() {
  console.log("🎖️  發放勳章...");
  const users = await db.user.findMany({
    where: { email: { endsWith: "@jkforum.test" } },
    select: { id: true, userGroup: true },
  });
  const medals = await db.medal.findMany({ select: { id: true, slug: true } });

  let granted = 0;
  for (const u of users) {
    // 每人 3-7 枚勳章
    const num = Math.floor(Math.random() * 5) + 3;
    const picks = medals.sort(() => Math.random() - 0.5).slice(0, num);
    for (const m of picks) {
      try {
        await db.userMedal.create({
          data: { userId: u.id, medalId: m.id, note: "seed 發放" },
        });
        granted++;
      } catch {}
    }
    // VIP 用戶確保有 vip-platinum
    if (u.userGroup === "VIP") {
      const vip = medals.find((m) => m.slug === "vip-platinum");
      if (vip) {
        try {
          await db.userMedal.create({
            data: { userId: u.id, medalId: vip.id, note: "VIP 自動" },
          });
          granted++;
        } catch {}
      }
    }
  }
  console.log(`   ✅ ${granted} medals granted`);
}

async function seedChatMessages() {
  console.log("💭 建立聊天訊息...");
  const users = await db.user.findMany({
    where: { email: { endsWith: "@jkforum.test" } },
    select: { id: true },
  });
  const rooms = await db.chatRoom.findMany({ select: { id: true, slug: true } });

  let created = 0;
  for (const room of rooms) {
    const count = room.slug === "lobby" ? 50 : 20;
    for (let i = 0; i < count; i++) {
      const sender = users[Math.floor(Math.random() * users.length)];
      const content = CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)];
      try {
        await db.chatMessage.create({
          data: {
            roomId: room.id,
            senderId: sender.id,
            content,
            createdAt: new Date(Date.now() - Math.random() * 86400000 * 2),
          },
        });
        created++;
      } catch {}
    }
  }
  console.log(`   ✅ ${created} chat messages`);
}

async function seedBlogs() {
  console.log("📓 建立日誌...");
  const users = await db.user.findMany({
    where: { email: { endsWith: "@jkforum.test" }, readPermission: { gte: 30 } },
    select: { id: true, displayName: true },
    take: 15,
  });

  let created = 0;
  let bs = 5000;
  for (const u of users) {
    const tmpl = BLOG_TEMPLATES[bs % BLOG_TEMPLATES.length];
    bs++;
    try {
      const blog = await db.blog.create({
        data: {
          authorId: u.id,
          title: tmpl.title,
          content: `<p>大家好，我是 ${u.displayName}，今天想跟大家分享 ${tmpl.title}。</p>
<p><img src="${img(`blog-${bs}`, 800, 450)}" /></p>
<h3>背景</h3>
<p>${PARAGRAPH_BANK[bs % PARAGRAPH_BANK.length]}</p>
<h3>過程</h3>
<p>${PARAGRAPH_BANK[(bs + 1) % PARAGRAPH_BANK.length]}</p>
<h3>結論</h3>
<p>${PARAGRAPH_BANK[(bs + 2) % PARAGRAPH_BANK.length]}</p>`,
          coverUrl: img(`blog-cover-${bs}`, 1200, 400),
          isPublic: true,
          viewCount: Math.floor(Math.random() * 500) + 50,
          likeCount: Math.floor(Math.random() * 30),
          createdAt: new Date(Date.now() - Math.random() * 30 * 86400000),
        },
      });
      // 每篇 1-3 留言
      const comments = Math.floor(Math.random() * 3) + 1;
      for (let c = 0; c < comments; c++) {
        const others = await db.user.findMany({
          where: { email: { endsWith: "@jkforum.test" }, id: { not: u.id } },
          take: 5,
        });
        const author = others[Math.floor(Math.random() * others.length)];
        if (!author) continue;
        await db.blogComment.create({
          data: {
            blogId: blog.id,
            authorId: author.id,
            content: ["寫得真好！", "感謝分享 🙏", "我也有同感", "這篇收藏了"][c % 4],
          },
        });
      }
      created++;
    } catch {}
  }
  console.log(`   ✅ ${created} blogs (with comments)`);
}

async function seedPolls() {
  console.log("🗳️  建立投票帖...");
  const posts = await db.post.findMany({
    where: { poll: null },
    take: 5,
    orderBy: { createdAt: "desc" },
  });
  const POLL_DATA = [
    { question: "你覺得 2026 年最值得期待的事？", options: ["AI 普及", "太空旅行商業化", "電動車降價", "VR 元宇宙重啟"] },
    { question: "週末最想做的事？", options: ["睡到自然醒", "出國玩", "宅在家追劇", "跟朋友聚會"] },
    { question: "理想伴侶的條件中你最重視？", options: ["經濟能力", "個性合得來", "外貌", "家庭背景", "興趣相投"] },
    { question: "如果中樂透 1 億，你會？", options: ["投資理財", "環遊世界", "買房", "提早退休"] },
    { question: "JKForum 你最常使用的功能？", options: ["看文章", "發文", "聊天室", "遊戲中心", "個人日誌"] },
  ];
  let created = 0;
  const users = await db.user.findMany({
    where: { email: { endsWith: "@jkforum.test" } },
    select: { id: true },
  });
  for (let i = 0; i < posts.length && i < POLL_DATA.length; i++) {
    const post = posts[i];
    const data = POLL_DATA[i];
    const poll = await db.poll.create({
      data: {
        postId: post.id,
        question: data.question,
        multiSelect: i === 2,  // 第 3 個多選
      },
    });
    const optionRows: { id: string }[] = [];
    for (let j = 0; j < data.options.length; j++) {
      const opt = await db.pollOption.create({
        data: { pollId: poll.id, label: data.options[j], sortOrder: j },
      });
      optionRows.push({ id: opt.id });
    }
    // 隨機投 5-15 票
    const voteCount = Math.floor(Math.random() * 11) + 5;
    const voted = new Set<string>();
    for (let v = 0; v < voteCount; v++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const opt = optionRows[Math.floor(Math.random() * optionRows.length)];
      const key = `${user.id}-${opt.id}`;
      if (voted.has(key)) continue;
      voted.add(key);
      try {
        await db.pollVote.create({
          data: { pollId: poll.id, optionId: opt.id, userId: user.id },
        });
      } catch {}
    }
    // 重算 voteCount
    for (const opt of optionRows) {
      const c = await db.pollVote.count({ where: { optionId: opt.id } });
      await db.pollOption.update({ where: { id: opt.id }, data: { voteCount: c } });
    }
    created++;
  }
  console.log(`   ✅ ${created} polls`);
}

async function seedSocialGraph() {
  console.log("🤝 互動 graph (好友/追蹤/簽到)...");
  const users = await db.user.findMany({
    where: { email: { endsWith: "@jkforum.test" } },
    select: { id: true },
  });
  if (users.length < 5) return;

  let friendCount = 0, followCount = 0, checkinCount = 0;

  // 隨機 30 對好友
  for (let i = 0; i < 30; i++) {
    const a = users[Math.floor(Math.random() * users.length)];
    const b = users[Math.floor(Math.random() * users.length)];
    if (a.id === b.id) continue;
    try {
      await db.friendship.create({
        data: {
          requesterId: a.id,
          addresseeId: b.id,
          status: FriendStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });
      friendCount++;
    } catch {}
  }

  // 隨機 50 條追蹤
  for (let i = 0; i < 50; i++) {
    const a = users[Math.floor(Math.random() * users.length)];
    const b = users[Math.floor(Math.random() * users.length)];
    if (a.id === b.id) continue;
    try {
      await db.userFollow.create({
        data: { followerId: a.id, followingId: b.id },
      });
      followCount++;
    } catch {}
  }

  // 每人最近 7 天隨機簽到
  for (const u of users) {
    const days = Math.floor(Math.random() * 7) + 1;
    for (let d = 0; d < days; d++) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - d);
      try {
        await db.checkin.create({
          data: {
            userId: u.id,
            date,
            streak: d + 1,
            coinsEarned: 30 + d * 5,
          },
        });
        checkinCount++;
      } catch {}
    }
  }

  console.log(`   ✅ friends=${friendCount} follows=${followCount} checkins=${checkinCount}`);
}

async function seedGameInventory() {
  console.log("🎒 給用戶遊戲道具...");
  const users = await db.user.findMany({
    where: { email: { endsWith: "@jkforum.test" } },
    select: { id: true },
    take: 10,
  });
  const items = await db.gameItem.findMany({ select: { id: true } });
  if (items.length === 0) return;

  let granted = 0;
  for (const u of users) {
    const numItems = Math.floor(Math.random() * 8) + 3;
    const picks = items.sort(() => Math.random() - 0.5).slice(0, numItems);
    for (const it of picks) {
      try {
        await db.userGameItem.create({
          data: {
            userId: u.id,
            itemId: it.id,
            quantity: Math.floor(Math.random() * 10) + 1,
          },
        });
        granted++;
      } catch {}
    }
  }
  console.log(`   ✅ ${granted} game items distributed`);
}

async function seedRatings() {
  console.log("⭐ 文章評分...");
  const posts = await db.post.findMany({
    select: { id: true, authorId: true },
    take: 80,
    orderBy: { viewCount: "desc" },
  });
  const users = await db.user.findMany({
    where: { email: { endsWith: "@jkforum.test" } },
    select: { id: true },
  });

  let created = 0;
  for (const p of posts) {
    const numRaters = Math.floor(Math.random() * 5) + 1;
    const raters = users.filter((u) => u.id !== p.authorId).sort(() => Math.random() - 0.5).slice(0, numRaters);
    let total = 0;
    for (const r of raters) {
      const score = Math.floor(Math.random() * 3) + 3;  // 3-5 分為主
      try {
        await db.postRating.create({
          data: { postId: p.id, userId: r.id, score },
        });
        total += score;
        created++;
      } catch {}
    }
    if (raters.length > 0) {
      await db.post.update({
        where: { id: p.id },
        data: {
          ratingAvg: total / raters.length,
          ratingCount: raters.length,
        },
      });
    }
  }
  console.log(`   ✅ ${created} ratings created`);
}

async function seedTips() {
  console.log("🎁 打賞紀錄...");
  const users = await db.user.findMany({
    where: { email: { endsWith: "@jkforum.test" } },
    select: { id: true },
  });
  const posts = await db.post.findMany({
    select: { id: true, authorId: true },
    take: 30,
    orderBy: { likeCount: "desc" },
  });

  let created = 0;
  for (const p of posts) {
    const num = Math.floor(Math.random() * 4);
    for (let i = 0; i < num; i++) {
      const from = users[Math.floor(Math.random() * users.length)];
      if (from.id === p.authorId) continue;
      const amount = [50, 100, 200, 500][Math.floor(Math.random() * 4)];
      try {
        await db.tip.create({
          data: {
            fromId: from.id,
            toId: p.authorId,
            postId: p.id,
            amount,
            message: ["寫得很棒！", "感謝分享", "支持一下！"][i % 3],
          },
        });
        created++;
      } catch {}
    }
  }
  console.log(`   ✅ ${created} tips`);
}

async function seedFavoritesAndLikes() {
  console.log("⭐ 收藏 + 讚...");
  const users = await db.user.findMany({
    where: { email: { endsWith: "@jkforum.test" } },
    select: { id: true },
  });
  const posts = await db.post.findMany({ select: { id: true, authorId: true }, take: 100 });

  let likes = 0, favs = 0;
  for (const p of posts) {
    // 5-30 個讚
    const numLikes = Math.floor(Math.random() * 25) + 5;
    const likers = users.sort(() => Math.random() - 0.5).slice(0, numLikes);
    for (const u of likers) {
      try {
        await db.like.create({ data: { userId: u.id, postId: p.id, isLike: true } });
        likes++;
      } catch {}
    }
    // 1-8 個收藏
    const numFavs = Math.floor(Math.random() * 7) + 1;
    const favvers = users.sort(() => Math.random() - 0.5).slice(0, numFavs);
    for (const u of favvers) {
      try {
        await db.favorite.create({ data: { userId: u.id, postId: p.id } });
        favs++;
      } catch {}
    }
  }
  console.log(`   ✅ likes=${likes} favorites=${favs}`);
}

async function recountStats() {
  console.log("🔄 重算統計快取...");
  const profiles = await db.userProfile.findMany({ select: { userId: true } });
  for (const pf of profiles) {
    const [postCount, replyCount, likeCount, follow, follower] = await Promise.all([
      db.post.count({ where: { authorId: pf.userId, status: "PUBLISHED" } }),
      db.reply.count({ where: { authorId: pf.userId, status: "PUBLISHED" } }),
      db.like.count({ where: { userId: pf.userId } }),
      db.userFollow.count({ where: { followerId: pf.userId } }),
      db.userFollow.count({ where: { followingId: pf.userId } }),
    ]);
    await db.userProfile.update({
      where: { userId: pf.userId },
      data: { postCount, replyCount, likeCount, followingCount: follow, followerCount: follower },
    });
  }
  console.log(`   ✅ recounted ${profiles.length} profiles`);
}

async function main() {
  console.log("🌱 大型運營 seed 開始...\n");
  await seedUsers();
  await seedExtraMedals();
  await seedPosts();
  await seedReplies();
  await seedMedalDistribution();
  await seedChatMessages();
  await seedBlogs();
  await seedPolls();
  await seedSocialGraph();
  await seedGameInventory();
  await seedRatings();
  await seedTips();
  await seedFavoritesAndLikes();
  await recountStats();
  console.log("\n✅ 完成！");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error("❌", e);
    await db.$disconnect();
    process.exit(1);
  });
