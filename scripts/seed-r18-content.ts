/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient, PostStatus, PostVisibility, ContentRating } from "@prisma/client";

const db = new PrismaClient();

const img = (seed: string | number, w = 640, h = 800) =>
  `https://picsum.photos/seed/r18-${encodeURIComponent(String(seed))}/${w}/${h}`;

// 主題標題模板（依 forum slug 對應）
const TITLES: Record<string, string[]> = {
  "av-news": [
    "🎬 2026 春季新作情報整理 — 三上〇〇引退作確定",
    "📅 4 月新片速報 — S1/Madonna/Faleno 大作齊發",
    "🆕 新人女優出道資訊 — 本月 5 位新血加入",
    "🔥 月度 TOP 10 銷售排行公布",
    "🎥 廠牌週年企劃 — 群體共演特別作",
    "📰 業界動態：知名女優開設個人 IP 廠牌",
    "🌟 引退倒數：粉絲送別企劃發起",
    "🎞️ 新導演首作正式公開",
  ],
  "quest-search": [
    "[懸賞 500] 求 2025 SSNI 系列特定作品",
    "[懸賞 1000] 求 4K 高畫質版本",
    "[懸賞 200] 跪求字幕組翻譯",
    "[已解決] 感謝 @xxx 提供連結，已撤懸賞",
    "[懸賞 800] 求未刪減完整版",
    "[懸賞 300] 求老作品數位修復版",
  ],
  "quest-actress": [
    "[搜女優] 黑長髮 / 白皙 / 大眼 / 約 165cm",
    "[搜女優] 短髮、酒窩、笑容超甜的那位是誰？",
    "[搜女優] 2024 年新人，封面背景是粉紅色的",
    "[已解決] 感謝大大解答！原來是 ⭐⭐⭐",
    "[搜女優] 紋身在腰部、學生風的那位",
    "[搜女優] 早期 2010 年代的某位高人氣女優",
  ],
  "adult-discussion": [
    "[討論] 哪間廠牌 2026 年表現最強？",
    "[心得] 訂閱 FANZA 一年的真實心得",
    "[發問] 新手入門推薦哪幾位？",
    "[討論] 字幕組 vs 無字幕，你的選擇？",
    "[分享] 我的收藏管理方式 — 1TB 整理術",
    "[討論] 4K vs Full HD 真的有差嗎？",
    "[心情] 老婆發現了我的硬碟…",
  ],
  "adult-pics-cool": [
    "🌊 海邊比基尼寫真 — 夏日清涼合輯",
    "💃 健身辣妹日常 — 緊身褲視角",
    "👙 泳裝模特兒 — 泳池畔身材展示",
    "🎀 兔女郎 cosplay — 高品質出借",
    "🌸 制服系列 — 校園清純風",
    "💃 ShowGirl 賽事精選 — 本週 TOP",
    "🎨 寫真集出版 — 新書速報",
  ],
  "adult-pics-sexy": [
    "🔥 性感內衣 — 白色透膚款震撼登場",
    "💋 韓系巨乳辣妹 — 本週爆紅",
    "🍑 翹臀美腿合輯 — 健身房直擊",
    "💄 黑絲女王 — 辦公室秘書系",
    "🌹 紅色系列 — 媚惑無極限",
    "💎 鑽石級寫真 — VIP 限定預覽",
  ],
  "adult-stream-asia": [
    "[線上看] 2026 最新熱門作品連結整理",
    "[線上看] 高畫質串流站推薦",
    "[線上看] 廠牌年度精選播放清單",
    "[線上看] 新人女優出道作合集",
    "[線上看] 經典作品數位修復重發",
  ],
  "dl-bt-video": [
    "[BT] 4K 高清版本種子分享",
    "[BT] 廠牌全集打包 (300GB+)",
    "[BT] 月度新片合集 — 完整版",
    "[BT] 經典老片數位修復版",
    "[BT] 字幕版完整資源",
  ],
  "dl-free-video": [
    "[免空] MEGA 雲端 — 月度合輯",
    "[免空] Rapidgator 高速下載",
    "[免空] 1Fichier — 日本廠牌專區",
    "[免空] Katfile 連結整理",
    "[免空] Turbobit 新片資源",
  ],
  "dl-anime": [
    "[BT 動畫] 2026 春季新番 18+ 整理",
    "[BT 動畫] OVA 全集打包",
    "[BT 動畫] 經典動畫修復版",
    "[BT 動畫] 同人作品合集",
  ],
  "dl-games": [
    "[BT 遊戲] 美少女遊戲新作 — 完整版",
    "[BT 遊戲] Galgame 月度合輯",
    "[BT 遊戲] 漢化版分享",
    "[BT 遊戲] 經典名作整理包",
  ],
  massage: [
    "[心得] 信義區某店油壓 SPA — 新妹超推",
    "[討論] 全身按摩 vs 局部，哪種放鬆效果好？",
    "[分享] 我的養生館口袋名單",
    "[心得] 第一次體驗，緊張到不行 (爆笑分享)",
    "[討論] 中山區 vs 林森北，師傅技術差別",
  ],
  "bar-uniform": [
    "[心得] 林森北 5 間制服店比較",
    "[討論] 酒店消費新手 — 有什麼要注意的？",
    "[分享] 禮服店初體驗 — 從 0 到 1 教學",
    "[討論] 中山區 vs 信義區酒店，哪邊小姐好？",
  ],
};

const BODY_LINES = [
  "本篇純屬個人心得，僅供參考，請勿過度解讀。",
  "圖片與資源來源：網路公開分享。",
  "如有侵權請告知，會立即下架。",
  "歡迎留言交流心得！",
  "資源放在留言區，請耐心等待補檔。",
  "感謝看到這裡的大家 🙏",
];

function richHtml(title: string, seed: number, picCount = 4): string {
  const pics = Array.from({ length: picCount }, (_, i) => img(`${seed}-${i}`)).map(
    (u) => `<p><img src="${u}" alt="${title}" /></p>`
  ).join("\n");
  const para = (n: number) => BODY_LINES[(seed + n) % BODY_LINES.length];
  return `<p>${para(0)}</p>\n${pics}\n<p>${para(1)}</p>\n<p>${para(2)}</p>`;
}

async function main() {
  console.log("🔞 R-18 內容補強...");

  const r18Forums = await db.forum.findMany({
    where: { rating: "R18" },
    select: { id: true, slug: true, name: true },
  });

  const users = await db.user.findMany({
    where: { email: { endsWith: "@jkforum.test" } },
    select: { id: true },
  });

  if (r18Forums.length === 0 || users.length === 0) {
    console.log("   ⚠️  no r18 forums or users");
    return;
  }

  let created = 0;
  let seed = 9000;

  for (const forum of r18Forums) {
    const titles = TITLES[forum.slug] ?? TITLES["adult-discussion"];
    const count = forum.slug.startsWith("adult-pics") ? 12 : 6;  // 貼圖區多放
    for (let i = 0; i < count; i++) {
      const title = titles[(seed + i) % titles.length];
      const author = users[(seed + i) % users.length];
      seed++;
      const slug = `r18-${forum.slug}-${seed}-${Date.now().toString(36)}`;
      const created_at = new Date(Date.now() - Math.random() * 30 * 86400000);
      const picCount = forum.slug.startsWith("adult-pics") ? 6 : 3;
      try {
        await db.post.create({
          data: {
            authorId: author.id,
            forumId: forum.id,
            title,
            content: richHtml(title, seed, picCount),
            excerpt: title.slice(0, 200),
            slug,
            status: PostStatus.PUBLISHED,
            visibility: PostVisibility.PUBLIC,
            rating: ContentRating.R18,
            viewCount: Math.floor(Math.random() * 8000) + 500,
            likeCount: Math.floor(Math.random() * 300) + 20,
            replyCount: Math.floor(Math.random() * 30),
            favoriteCount: Math.floor(Math.random() * 80),
            ratingAvg: 3 + Math.random() * 2,
            ratingCount: Math.floor(Math.random() * 30),
            createdAt: created_at,
            lastReplyAt: created_at,
          },
        });
        created++;
      } catch {}
    }
  }

  console.log(`   ✅ ${created} R-18 posts created across ${r18Forums.length} forums`);

  // 順便補幾則 R-18 聊天室訊息
  const adultRoom = await db.chatRoom.findUnique({ where: { slug: "adult" } });
  if (adultRoom) {
    const adultMsgs = [
      "新人請多多指教～",
      "今天哪邊有新片？",
      "求推薦最近的好作品",
      "大大們都用什麼播放器？",
      "VIP 真的值得嗎",
      "感謝分享 🙏",
    ];
    let chatCount = 0;
    for (let i = 0; i < 30; i++) {
      const sender = users[Math.floor(Math.random() * users.length)];
      try {
        await db.chatMessage.create({
          data: {
            roomId: adultRoom.id,
            senderId: sender.id,
            content: adultMsgs[Math.floor(Math.random() * adultMsgs.length)],
            createdAt: new Date(Date.now() - Math.random() * 86400000),
          },
        });
        chatCount++;
      } catch {}
    }
    console.log(`   ✅ ${chatCount} adult chat messages added`);
  }

  // 重算統計快取
  for (const forum of r18Forums) {
    const c = await db.post.count({ where: { forumId: forum.id, status: "PUBLISHED" } });
    await db.forum.update({ where: { id: forum.id }, data: { postCount: c } });
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
