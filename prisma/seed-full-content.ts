/**
 * Full-content seed: generate realistic threads for ALL 14 forums
 * with bodies (multi-paragraph), replies, likes, and favorites.
 *
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-full-content.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================================
// 每個版的內容模板（slug → 一組貼文）
// ============================================================
type SeedPost = {
  tag: string;
  title: string;
  body: string[];
  replies?: { author: string; body: string }[];
};
type ForumSeed = {
  slug: string;
  posts: SeedPost[];
};

const FORUM_SEEDS: ForumSeed[] = [
  {
    slug: "chitchat",
    posts: [
      {
        tag: "討論",
        title: "大家最近有感覺得「脆」越來越難用了嗎？",
        body: [
          "Threads 剛出的時候，本來以為是一個可以隨便碎碎念的地方。",
          "結果現在滑開，不是「徵求意見」的業配文、就是各種感情觀的「毒雞湯」，",
          "不然就是一堆人在上面互開地圖炮戰性別、戰政治。",
          "想問問大家：你現在每天花多少時間在 Threads 上？還會想發文嗎？",
        ],
        replies: [
          { author: "hst993", body: "同感，演算法越來越怪，推給我一堆完全沒興趣的東西" },
          { author: "RuoYanSPA", body: "還有詐騙也變多了..雖然無聊還是可以看看打發時間" },
          { author: "只有一個雲雲", body: "感覺裡面誰都有 就是沒有台灣的 哈哈" },
        ],
      },
      {
        tag: "討論",
        title: "假如明天是世界末日或是處刑日，你最後一頓飯要吃什麼？",
        body: [
          "突然想到這個問題。",
          "我自己會選牛肉麵 + 滷蛋 + 一大碗白飯，配可樂。",
          "不是什麼稀有食物，就是從小吃到大最安心的味道。",
          "你們呢？會選米其林三星、還是家裡媽媽煮的？",
        ],
        replies: [
          { author: "饕客阿明", body: "媽媽煮的蕃茄炒蛋 + 熱騰騰白飯 沒有之一" },
          { author: "肉食系", body: "壽喜燒吃到飽 配冰啤酒 爽死" },
        ],
      },
      {
        tag: "討論",
        title: "沒人發現現在麥當勞的雞塊越來越不好吃了",
        body: [
          "以前的雞塊咬下去是那種鬆軟又有雞肉味的感覺，",
          "現在咬起來整個有種海綿感，表皮也沒以前那麼脆。",
          "是因為配方改了嗎？還是我自己的記憶在美化過去？",
        ],
        replies: [
          { author: "薯條控", body: "+1 覺得薯條也沒以前鹹了" },
          { author: "漢堡神偷", body: "價格倒是漲了不少" },
        ],
      },
      {
        tag: "分享",
        title: "(轉貼) 愛被拍馬屁的國王",
        body: [
          "有個國王，很喜歡聽好聽話，導致朝堂上，都是愛拍馬屁的小人。",
          "某天，偵查兵告訴國王，鄰國大軍已經跨越邊境，百姓都很害怕。",
          "結果國王身邊的小人就說，我們國家很強大，鄰國那麼弱，不可能會出現這種事！",
          "於是國王把偵查兵殺了，派了另一個人去查。那個人查完回來路上被哥哥警告：「說好話才能活命。」",
          "他回去跟國王說「一路上沒看到敵軍」。國王非常高興賞他珍寶。",
          "沒多久，鄰國大軍攻過來，國王在睡夢中就被滅國了。",
          "讀後心得：人人都想要快樂，但如果用不好的方式去獲得，絕對是有害無益的。",
        ],
        replies: [
          { author: "歷史迷", body: "這跟現代職場好像..." },
          { author: "老王", body: "寓意深遠 謝謝分享" },
        ],
      },
      {
        tag: "討論",
        title: "用交友軟體出去約會「AA制」到底是不是雷？",
        body: [
          "昨天跟一個交友軟體認識的女生出去。",
          "吃完飯要結帳時我說「各自付就好」，她的表情立刻變了。",
          "是我做錯了嗎？現在這年代 AA 制不算正常嗎？",
          "還是有什麼眉角我沒搞懂？",
        ],
        replies: [
          { author: "Chun", body: "看場合吧 第一次約會男生付比較好看" },
          { author: "感情顧問", body: "AA 沒錯但第一次會扣分是真的" },
          { author: "佛系", body: "遇到會計較的就不用繼續了" },
        ],
      },
      {
        tag: "心情貼",
        title: "我的發票都不會中 QQ",
        body: [
          "連續 2 年對發票 連 200 都沒中過。",
          "是我前世做錯什麼嗎？",
          "看人家一堆人貼中獎文 真的很羨慕..",
        ],
        replies: [
          { author: "Ray", body: "我也是每次都槓龜 發財金拿不到" },
          { author: "幸運兒", body: "分你一點 我今年中了 2000" },
        ],
      },
      {
        tag: "討論",
        title: "早餐的選擇太多了",
        body: [
          "我家附近 500 公尺內至少有 15 間早餐店：",
          "美而美系、麥味登、早安美芝城、弘爺、Q Burger、7-11、全家...",
          "結果我每天要花 10 分鐘煩惱吃什麼 😭",
          "大家是怎麼解決這個選擇障礙的？",
        ],
        replies: [
          { author: "選擇恐懼症", body: "我固定週一到五都吃一樣的 週末才換" },
          { author: "美食家", body: "照心情選 今天累就吃 7-11 飯糰" },
        ],
      },
      {
        tag: "發問",
        title: "收到詐騙郵件怎麼辦？",
        body: [
          "今天收到一封自稱是銀行的郵件，說我帳戶有異常要我點連結驗證。",
          "我看了一下 URL 根本不是銀行的網址。",
          "要不要報警？還是直接刪除就好？",
          "這種詐騙怎麼防比較好？",
        ],
        replies: [
          { author: "資安人", body: "165 反詐騙專線可以諮詢 附上郵件原始內容" },
          { author: "過來人", body: "直接刪除 + 標記垃圾郵件 別點任何連結" },
        ],
      },
    ],
  },
  {
    slug: "feelings",
    posts: [
      {
        tag: "求助",
        title: "抓到女友跟前任還在聯絡...我拳頭硬了但打不下去",
        body: [
          "交往 2 年了 昨天無意間看到女友手機",
          "跟前任的對話還在持續 而且偶爾還會發「想你」這種訊息。",
          "不知道是不是踩到什麼紅線，但心真的很痛。",
          "我該攤牌還是當作沒看過？有過類似經驗的大大求解...",
        ],
        replies: [
          { author: "草哥", body: "攤牌 不然會一直心裡有疙瘩" },
          { author: "過來人", body: "建議直接問清楚 別拖" },
          { author: "別亂猜", body: "先看對話內容再說 有時候只是普通聊天" },
          { author: "分手快樂", body: "這種通常都要分手了 愛自己重要" },
        ],
      },
      {
        tag: "分享",
        title: "說實在的 女孩子追男生會丟臉嗎？",
        body: [
          "前陣子喜歡公司一個男同事，主動約他吃飯、傳訊息",
          "身邊朋友都說女生不要主動比較好，但我覺得錯過很可惜。",
          "你們怎麼看？女追男真的比較難成嗎？",
        ],
        replies: [
          { author: "現代女性", body: "不會阿 主動才有機會" },
          { author: "男生視角", body: "被主動追會覺得被重視 正面的" },
          { author: "謹慎派", body: "要看對方反應 單方面太積極會變壓力" },
        ],
      },
      {
        tag: "討論",
        title: "交往後才知道女朋友以前....",
        body: [
          "跟女友交往半年 她昨天主動跟我說她以前的感情經歷",
          "包括上一任和前幾任的事情，有些細節我聽了還滿衝擊的。",
          "我現在很糾結 她是誠實告訴我 但我卻沒辦法不去想...",
          "這算是我自己格局太小嗎？",
        ],
        replies: [
          { author: "n1", body: "每個人都有過去 重點是現在怎麼對你" },
          { author: "心理專家", body: "她願意告訴你就是信任 別讓這個變成心結" },
          { author: "別糾結", body: "你自己沒過去嗎？公平一點" },
        ],
      },
      {
        tag: "心理學",
        title: "快速走出失戀狀態的第一步",
        body: [
          "失戀真的很痛苦，但走出來的第一步不是「忘記他」。",
          "而是「承認自己還沒放下」。",
          "越是逼自己忘記，越會反覆想起。",
          "允許自己難過 2-3 週，好好哭、好好睡、吃愛吃的。",
          "然後一點一點找回自己的節奏，你會發現比強迫自己堅強好得多。",
        ],
        replies: [
          { author: "lqqlj", body: "說得真好 收藏了" },
          { author: "失戀者", body: "謝謝分享 讓我安心了一些" },
        ],
      },
      {
        tag: "發問",
        title: "分手了怎麼辦",
        body: [
          "交往 3 年今天被分手。",
          "完全沒有預警 對方說「我們不適合」就走了。",
          "我現在腦袋一片空白 連怎麼過明天都不知道。",
          "有誰有類似經驗嗎？第一個禮拜要怎麼熬？",
        ],
        replies: [
          { author: "走過的人", body: "一個禮拜會哭到脫水 但真的會好起來" },
          { author: "朋友", body: "出去走走 別一個人在家" },
        ],
      },
      {
        tag: "討論",
        title: "男友交了網婆怎麼辦?",
        body: [
          "男友最近玩手遊 認識了一個女生，兩個人組「夫妻隊」打副本",
          "看他們聊天有時候會用「老婆」「老公」互稱",
          "我提出不舒服他說「那只是遊戲」、「妳太敏感」",
          "我是真的太敏感嗎？還是這已經算精神出軌？",
        ],
        replies: [
          { author: "電玩族", body: "遊戲內稱呼真的常見 我跟隊友也互稱夫妻" },
          { author: "理性派", body: "重點不是稱呼 是交流有沒有越界" },
          { author: "女生視角", body: "妳不舒服就是問題 感情要雙方舒服才對" },
          { author: "和平主義", body: "跟他聊聊 說明感受 不要上升到吵架" },
        ],
      },
      {
        tag: "心理學",
        title: "初戀和別的結婚了有孩子離婚了，你會想和他/她重新在一起嗎？",
        body: [
          "前陣子看到一個 Netflix 影集有這個橋段，突然想問大家。",
          "如果你的初戀現在離婚了回頭找你，你會答應嗎？",
          "時空背景都變了，你們都不是當年的那個人了。",
          "這種感情是懷念初戀 還是真的還有愛？",
        ],
        replies: [
          { author: "只有一個雲雲", body: "不會 已經有現在的人 回頭是不負責" },
          { author: "浪漫派", body: "如果還單身 為什麼不" },
          { author: "現實派", body: "有孩子的話太複雜 不建議" },
        ],
      },
    ],
  },
  {
    slug: "help",
    posts: [
      {
        tag: "發問",
        title: "電腦藍屏一天三次怎麼辦？",
        body: [
          "最近 Win11 電腦開始頻繁藍屏。",
          "錯誤代碼 MEMORY_MANAGEMENT，記憶體測過沒問題。",
          "驅動都更新了 病毒也掃過。",
          "有人遇過類似狀況嗎？還有什麼可以試的？",
        ],
        replies: [
          { author: "電腦達人", body: "試試看 DDU 乾淨移除顯卡驅動 重裝" },
          { author: "資工仔", body: "開事件檢視器看詳細錯誤 記憶體有時壞某幾條才出事" },
        ],
      },
      {
        tag: "發問",
        title: "家裡 Wi-Fi 訊號差 要換路由器還是加中繼？",
        body: [
          "三房兩廳公寓 路由器放客廳，最遠房間 Wi-Fi 只剩一格訊號。",
          "網拍看了一下訊號延伸器、Mesh 系統，價差很大。",
          "大家是怎麼解決的？Mesh 真的比中繼器好嗎？",
        ],
        replies: [
          { author: "網管", body: "預算夠就 Mesh 省心 中繼訊號折半不穩" },
          { author: "小資族", body: "我用小米 AC1200 中繼夠用 看預算" },
        ],
      },
      {
        tag: "求助",
        title: "Google 帳號突然被鎖 怎麼救？",
        body: [
          "早上要登入 Gmail 結果跳出「異常活動」被鎖。",
          "填了一堆驗證問題都過不了。",
          "裡面有很多重要信件 QAQ",
          "有人成功過嗎？救帳號流程是不是很難？",
        ],
        replies: [
          { author: "IT", body: "用同 IP 同裝置 + 常用密碼提示 成功率比較高" },
          { author: "帳號收藏家", body: "建議平常就開啟 2FA + 備用信箱" },
        ],
      },
      {
        tag: "發問",
        title: "租屋處漏水 房東不處理怎麼辦？",
        body: [
          "天花板漏水三個月了 房東說「下次再說」",
          "已經傳訊息三次 都讀了沒回。",
          "合約還有 8 個月 可以提前解約嗎？或是有法律途徑？",
        ],
        replies: [
          { author: "法律系", body: "存證信函 + 租屋糾紛調解 對方不處理可以解約" },
          { author: "租屋族", body: "先拍照紀錄 一切按程序走" },
        ],
      },
    ],
  },
  {
    slug: "food",
    posts: [
      {
        tag: "分享",
        title: "台北東區這間隱藏版 Omakase 真的神級",
        body: [
          "週末去了朋友推薦的一間在巷子裡的 Omakase。",
          "$2800 / 人 包含 10 道生魚片 + 4 道煮物 + 炙燒握壽司。",
          "老闆娘會一道一道介紹食材產地，魚的新鮮度絕對沒話說。",
          "最驚艷的是最後的炙燒大腹 鮪魚油脂在嘴裡化開那瞬間...",
          "但要訂位真的很難 建議提早兩週。",
        ],
        replies: [
          { author: "美食家", body: "店名求！我也想試" },
          { author: "省錢族", body: "這個價錢可以吃壽司郎 20 次..." },
          { author: "饕客", body: "2800 以 Omakase 算便宜的 推" },
        ],
      },
      {
        tag: "分享",
        title: "自己做的蕃茄義大利麵 完勝連鎖店！",
        body: [
          "食材：牛番茄 4 顆、蒜頭 5 瓣、橄欖油、義大利麵、新鮮羅勒、帕瑪森起司",
          "步驟：",
          "1. 番茄去皮切丁 蒜頭爆香",
          "2. 下番茄小火慢燉 30 分鐘出沙",
          "3. 義大利麵煮 8 成熟 加入醬汁",
          "4. 起鍋前撒羅勒 + 起司",
          "真的比一堆連鎖店好吃 成本不到 $100！",
        ],
        replies: [
          { author: "主婦", body: "番茄要先燙過才好去皮 我也是這樣做" },
          { author: "義大利控", body: "加一點奶油會更滑順哦" },
        ],
      },
      {
        tag: "發問",
        title: "有人推薦台中必吃的鍋物嗎？",
        body: [
          "下個月要去台中玩三天兩夜",
          "朋友說台中鍋物超強 但選項太多不知道怎麼選",
          "有涮涮鍋、酸菜白肉鍋、韓式部隊鍋、麻辣鍋...",
          "預算一人 $800 以內 有推薦嗎？",
        ],
        replies: [
          { author: "台中人", body: "輕井澤 / 牛室精緻鍋物 都在預算內" },
          { author: "火鍋控", body: "問鼎麻辣鍋 必吃！" },
          { author: "在地人", body: "天然鍋物很不錯 有機食材 CP 高" },
        ],
      },
      {
        tag: "分享",
        title: "這間早餐店 阿嬤做的蛋餅 20 年老味道",
        body: [
          "從國中吃到現在 每週末早上一定要去報到",
          "麵糊是阿嬤自己調的 口感又Q又有麵香",
          "蛋餅 $35、蘿蔔糕 $30、豆漿 $20 真材實料",
          "重點是 阿嬤每天清晨 4 點就在準備 真的很用心",
        ],
        replies: [
          { author: "懷舊派", body: "這種老店越來越少了" },
          { author: "美食偵探", body: "地址求！要去朝聖" },
        ],
      },
    ],
  },
  {
    slug: "travel",
    posts: [
      {
        tag: "分享",
        title: "東京廣域三日券,真的有GO好玩之二【鎌倉.江之島】",
        body: [
          "第二天從新宿出發，使用 JR 東京廣域三日券。",
          "上午：鎌倉大佛 → 長谷寺 → 鶴岡八幡宮",
          "午餐：小町通り 的 豊島屋鳩サブレー + しらす丼",
          "下午：江之電搭到江之島 → 江之島神社 → 眺望富士山",
          "江之電穿過住宅區的畫面超像《灌籃高手》OP，隨便拍都是日劇感。",
          "總計票券 ¥15,000 / 人 含新幹線往返。",
        ],
        replies: [
          { author: "旅日達人", body: "鳩サブレー 的奶油餅乾必買" },
          { author: "動漫迷", body: "湘南海岸那個平交道我拍了 200 張..." },
          { author: "攻略王", body: "記得避開週末 平日人潮差一半" },
        ],
      },
      {
        tag: "其他",
        title: "超獵奇！越南胡志明市「真·佛系」樂園",
        body: [
          "這是我去越南的時候無意間路過的地方。",
          "水上樂園以神佛做主題 廣播還在放佛經",
          "滑水道是蓮花造型 泳圈是觀音像",
          "遊客進園要赤腳 園內禁止葷食。",
          "雖然很獵奇但體驗下來竟然很平靜...值得一去",
        ],
        replies: [
          { author: "背包客", body: "這也太特別了吧 照片求" },
          { author: "佛系", body: "聽起來很療癒" },
        ],
      },
      {
        tag: "其他",
        title: "賞櫻最前線 嚴選大阪櫻花 七大景點",
        body: [
          "3 月底到 4 月中是大阪最佳賞櫻期。",
          "1. 大阪城公園 — 3000 棵櫻花圍繞天守閣",
          "2. 造幣局櫻花大道 — 櫻花隧道 年度限定 1 週",
          "3. 萬博紀念公園 — 5500 棵 9 種品種",
          "4. 毛馬櫻之宮公園 — 沿著大川 5000 棵",
          "5. 大仙公園 — 1000 棵古墳園區",
          "6. 長居公園 — 免費入場 人潮少",
          "7. 枚方公園 — 遊樂園 + 櫻花",
        ],
        replies: [
          { author: "日本控", body: "造幣局限定 1 週真的搶不到票" },
          { author: "攝影師", body: "大阪城夜櫻打燈超美 必訪" },
        ],
      },
      {
        tag: "分享",
        title: "韓國小眾景區二 慶尚北道避世行",
        body: [
          "避開首爾釜山人潮，這次玩了慶尚北道 4 天。",
          "尚州柿餅村 — 秋天滿園紅柿子",
          "安東河回村 — 世界文化遺產 木造老屋",
          "榮州浮石寺 — 韓國最古老木造建築",
          "慶州大陵苑 — 新羅王朝古墳群",
          "住民宿 $1500/晚 含早餐 比首爾便宜一半。",
        ],
        replies: [
          { author: "文青", body: "這種古城村落才是韓國真正的味道" },
          { author: "韓妞", body: "收藏！下次想避開人潮就去這裡" },
        ],
      },
    ],
  },
  {
    slug: "entertainment",
    posts: [
      {
        tag: "分享",
        title: "《穿著 Prada的惡魔2》終極版預告上線 米蘭達時尚危機重現",
        body: [
          "等了整整 19 年 續集終於來了。",
          "梅莉史翠普 + 安海瑟薇 + 艾蜜莉布朗 原班人馬回歸。",
          "這次劇情設定在數位媒體時代 時尚雜誌產業面臨崩潰。",
          "預告片裡 Andy 變成創業家 Miranda 還在掌權 Runway。",
          "重現了一模一樣的換裝場景 配樂直接戳中所有粉絲淚腺。",
          "上映日期：2026 年夏季。",
        ],
        replies: [
          { author: "時尚迷", body: "等了快 20 年 已哭" },
          { author: "米蘭達粉", body: "梅姨的眼神殺還是那麼經典" },
          { author: "影評", body: "希望不要只是消費情懷" },
        ],
      },
      {
        tag: "分享",
        title: "韓劇《魷魚遊戲 3》正式定檔 預告血量滿點",
        body: [
          "Netflix 官方公佈《魷魚遊戲 3》上線日期：2026/12",
          "李政宰確定回歸 李秉憲、孔劉都還在。",
          "預告片裡出現 8 種新遊戲 包括改版的「紅綠燈」",
          "導演黃東赫表示「這會是最殘酷的一季」",
          "看完預告手心都在冒汗 2026 年底準備耗爆網路頻寬。",
        ],
        replies: [
          { author: "K-drama", body: "第二季已經很血腥 第三季會是什麼等級..." },
          { author: "Netflix 粉", body: "希望不要拍爛 撐住啊" },
        ],
      },
      {
        tag: "分享",
        title: "宋仲基、宋慧喬《太陽的後裔》10 週年！復出主演特別篇",
        body: [
          "2016 年紅遍亞洲的《太陽的後裔》要拍 10 週年特別篇！",
          "導演李應福親自證實 原班人馬幾乎回歸。",
          "劇情設定在 10 年後 兩人結婚 有了孩子的生活。",
          "KBS + Netflix 聯播 預計 2026 年底上檔。",
        ],
        replies: [
          { author: "韓劇迷", body: "看過 3 次 主題曲現在還會哼" },
          { author: "cp 粉", body: "他們現實中都離婚了...看戲有點心酸" },
        ],
      },
      {
        tag: "分享",
        title: "金像獎》舒淇《女孩》奪「新晉導演」謙虛自嘲太老了",
        body: [
          "第 43 屆香港電影金像獎昨日揭曉。",
          "舒淇以執導的《女孩》首次跨界拿下「新晉導演獎」。",
          "她致詞時自嘲：「我這個新晉導演太老了吧！」引全場大笑。",
          "這部電影是她的導演處女作 探討家暴議題。",
          "梁家輝則第五度封帝 哽咽感謝太太支持。",
        ],
        replies: [
          { author: "影迷", body: "女孩這部片真的很震撼 舒淇實力派" },
          { author: "金像獎觀眾", body: "梁家輝 5 次封帝史上少見" },
        ],
      },
    ],
  },
  {
    slug: "world-news",
    posts: [
      {
        tag: "國際",
        title: "載運200萬桶原油駛向台灣 君善輪通過荷莫茲海峽",
        body: [
          "中油租用的超大型油輪「君善輪」今（21）日宣布通過中東荷莫茲海峽。",
          "載運 200 萬桶原油 預計 5 月中旬抵達台中港。",
          "這批原油來自沙烏地阿拉伯與阿布達比 主要供應台灣煉油廠。",
          "近期中東局勢雖緊張 但航運公司表示「全程保持安全距離」。",
        ],
        replies: [
          { author: "能源觀察", body: "希望油價不會因此漲..." },
          { author: "船務", body: "荷莫茲是世界最繁忙海峽 安全是第一" },
        ],
      },
      {
        tag: "國際",
        title: "日本規模7.5強震！海嘯警報 首相高市早苗發聲",
        body: [
          "日本時間今晨 5:23 九州近海發生規模 7.5 強震。",
          "氣象廳立即對九州、四國南部發布海嘯警報 預估高度 3 公尺。",
          "首相高市早苗已召開緊急應變會議 派遣自衛隊前往災區。",
          "目前已知 12 人受傷 無人死亡。",
          "交通方面 九州新幹線全線停駛 已影響逾 3 萬人行程。",
        ],
        replies: [
          { author: "旅日族", body: "下週要去熊本 心驚驚" },
          { author: "地震專家", body: "九州地震帶一直活躍 要注意後續餘震" },
        ],
      },
      {
        tag: "國際",
        title: "Cos《七龍珠》糗了！菲男童被父母乳膠漆塗全身 狂搓竟洗不掉",
        body: [
          "菲律賓一個 8 歲男童扮成悟空 父母竟用「乳膠漆」塗全身黃色。",
          "結果活動結束後發現根本洗不掉 連續搓了 3 天皮膚還是黃的。",
          "最後送到醫院用特殊溶劑才去除 差點造成皮膚永久傷害。",
          "醫生呼籲：萬聖節扮裝千萬不能用工業漆 有水洗顏料才安全。",
        ],
        replies: [
          { author: "驚呆", body: "乳膠漆怎麼會想到塗臉上..." },
          { author: "醫護", body: "這父母也太誇張 小孩差點毀容" },
        ],
      },
      {
        tag: "國際",
        title: "翻桌率就是生命 日本拉麵店「不准滑手機」掀討論",
        body: [
          "東京一間人氣拉麵店最近在門口掛出「用餐中禁用手機」告示。",
          "老闆接受採訪表示：「拉麵是要熱吃的 不是滑手機配麵」。",
          "消息一出 日本網友反應兩極。",
          "支持派：「好！食物最新鮮 15 分鐘內吃完最棒」",
          "反對派：「付錢吃個飯還要被管」",
          "你覺得這種規定合理嗎？",
        ],
        replies: [
          { author: "拉麵控", body: "認同！麵泡久了就爛了 有什麼好拍的" },
          { author: "消費者", body: "付錢是大爺 想怎麼吃是自由" },
        ],
      },
    ],
  },
  {
    slug: "taiwan-news",
    posts: [
      {
        tag: "生活",
        title: "3縣市長輩「免繳健保費」宣布了！1年省近萬元",
        body: [
          "繼台北市、新北市後，桃園市也宣布 65 歲以上長者免繳健保費。",
          "預計每年可省下 8,460 元 政策由市府全額補助。",
          "符合資格條件：設籍滿 1 年 + 65 歲以上。",
          "從今年 7 月開始實施 無需申請自動生效。",
          "預算每年 12 億 嘉惠約 14 萬名長者。",
        ],
        replies: [
          { author: "桃園人", body: "太好了 剛好我爸媽都符合條件" },
          { author: "政策觀察", body: "其他縣市會不會跟進？" },
        ],
      },
      {
        tag: "生活",
        title: "以前小一「自己走路上學」沒人信！過來人揭 2 命案：改變台灣社會",
        body: [
          "現在的家長幾乎都會接送小孩上下學 但 30 年前根本不是這樣。",
          "一位 40 多歲網友分享：「我小一就自己走路上學 書包掛胸前」",
          "回應他的留言爆炸多 很多人也說以前都是自己上下學。",
          "但過來人指出：「改變的分水嶺是幾起重大命案」",
          "1996 年彭婉如、1997 年白曉燕、劉邦友三大命案接連發生",
          "整個台灣從此不敢讓小孩自己行動 改變了一整代人的習慣。",
        ],
        replies: [
          { author: "四五年級", body: "以前真的都是三五成群走路 現在想起來很懷念" },
          { author: "歷史人文", body: "社會信任感的崩壞 很難重建" },
        ],
      },
      {
        tag: "綜合",
        title: "大甲媽 9 天 8 夜遶境首日！警狂開 177 張罰單",
        body: [
          "大甲媽祖遶境進香首日 警方沿線執法絕不留情。",
          "統計：開出 177 張交通罰單 沒戴安全帽最多 佔 132 張。",
          "其他違規包括逆向、闖紅燈、違停。",
          "警方表示「人多車多不代表可以違規 安全第一」",
          "遶境預計 9 天後回駕 總路程 340 公里。",
        ],
        replies: [
          { author: "信徒", body: "媽祖保佑大家平安 但安全帽真的要戴" },
          { author: "交通觀察", body: "這種大活動就該加強執法 保護民眾" },
        ],
      },
      {
        tag: "綜合",
        title: "伴屍4年！退休男瞞91歲母死訊 疑詐「20萬年金」",
        body: [
          "新北市警方昨天破獲一起駭人案件。",
          "一名 62 歲退休男子 母親於 4 年前過世 卻未辦理死亡登記。",
          "繼續領取母親每月 5 千元的老農年金 4 年共詐領約 24 萬。",
          "屍體被藏在房間冷氣櫃中 發現時已成乾屍。",
          "鄰居表示長期聞到異味但以為是廚餘。警方以詐欺、遺棄屍體罪移送。",
        ],
        replies: [
          { author: "震驚", body: "這種案件越來越多 真的無法理解" },
          { author: "社工", body: "獨居老人、子女孤立 社會安全網要加強" },
        ],
      },
    ],
  },
  {
    slug: "politics",
    posts: [
      {
        tag: "議題",
        title: "立院三讀通過「囤房稅 2.0」 2026 年起實施",
        body: [
          "立法院昨晚三讀通過《房屋稅條例》修正案。",
          "持有 4 戶以上非自住房屋 稅率從 3.6% 拉高到 4.8%。",
          "持有 5 戶以上 最高課到 6.0%。",
          "財政部估計全台約 40 萬戶受影響 年增稅收 85 億。",
          "建商團體反對：「這只會讓租金漲 不會讓房價跌」",
          "無殼族：「終於有感的政策 希望能打到真正在炒房的人」",
        ],
        replies: [
          { author: "財經", body: "4.8% 對真正炒房的還是毛毛雨" },
          { author: "無殼族", body: "有總比沒有好 支持繼續加重" },
          { author: "房東", body: "我只是退休靠租金過活的小房東 被一起掃到" },
        ],
      },
      {
        tag: "議題",
        title: "勞保年改再拖？新制已延後 3 年未定案",
        body: [
          "勞保基金即將在 2031 年破產的警訊 已經喊了 5 年。",
          "但新版年改方案至今仍未送立法院 藍綠白三黨都不敢動。",
          "勞動部長表示「還需要跨黨派協商」",
          "網友諷刺：「協商到破產為止嗎？」",
          "年輕勞工：「我們繳一輩子可能拿不到 不公平」",
        ],
        replies: [
          { author: "勞工", body: "政客不敢碰這個 票倉啊" },
          { author: "年輕世代", body: "每次就說協商 然後不了了之" },
        ],
      },
      {
        tag: "議題",
        title: "高鐵延伸屏東 經費 580 億 需要嗎？",
        body: [
          "交通部正式宣布高鐵延伸到屏東 預計 2032 年通車。",
          "總經費 580 億 中央負擔 75%、屏東縣府 25%。",
          "支持者：南部發展機會、促進觀光、均衡區域",
          "反對者：一天運量預估只有 5000 人 長期會大幅虧損",
          "政策該以經濟效益為主 還是區域公平？你怎麼看？",
        ],
        replies: [
          { author: "屏東人", body: "太棒了！終於不用每次都在左營轉車" },
          { author: "經濟學", body: "580 億投資回本要多少年 請先算清楚" },
          { author: "環評", body: "沿線生態影響也要一併考量" },
        ],
      },
    ],
  },
  {
    slug: "mobile",
    posts: [
      {
        tag: "開箱",
        title: "iPhone 18 Pro 深櫻桃色真機實拍 比想像中更沉穩",
        body: [
          "今天 Apple Store 鋪貨 第一時間衝去看實機。",
          "「深櫻桃」色不是想像中的亮紅色 而是偏棗紅帶點霧面。",
          "不同光線下顏色會變化 自然光是深紫紅 室內偏黑。",
          "比起去年的「宇宙橙」這次明顯更耐看。",
          "256GB 台灣定價 NT$40,900 8 月開賣。",
        ],
        replies: [
          { author: "果粉", body: "看實機後覺得顏色比預期好 準備入手" },
          { author: "攝影師", body: "這顏色在鏡頭下會偏深 提醒要買的人" },
        ],
      },
      {
        tag: "分享",
        title: "三星 S27 擬半數採用 Exynos 晶片 台灣版恐有變數",
        body: [
          "三星財報電話會議透露 下一代 S27 系列將重啟 Exynos 使用比例。",
          "歐美版：S27 / S27+ 使用 Exynos 2600",
          "S27 Ultra 全系列用高通驍龍 8 Gen 5",
          "亞洲版本尚未確定 過去台灣都是用高通。",
          "如果台灣版改成 Exynos 消費者反應可能不佳。",
        ],
        replies: [
          { author: "三星用戶", body: "Exynos 發熱還是一大問題 拜託不要" },
          { author: "硬體迷", body: "Exynos 2600 用 GAA 3nm 其實性能不錯" },
        ],
      },
      {
        tag: "分享",
        title: "Google 無螢幕手環傳下月發表 NBA 球星柯瑞已測試",
        body: [
          "Google 的神秘穿戴裝置「Pixel Band」將於 5 月發表。",
          "主打「無螢幕 極簡」 只有震動 + LED 指示燈。",
          "透過手機 App 管理通知、運動、健康數據。",
          "NBA 球星 Curry 已戴著它打球 數月證實「超輕薄」",
          "預估定價 $299 美金 (約 NT$9500)。",
        ],
        replies: [
          { author: "穿戴迷", body: "無螢幕的概念很不錯 專注體驗" },
          { author: "省電族", body: "無螢幕電池應該可以撐很久吧" },
        ],
      },
    ],
  },
  {
    slug: "hardware",
    posts: [
      {
        tag: "分享",
        title: "蘋果官方暗示 iOS 27 新介面！達人揭秘：動態島將成視覺焦點",
        body: [
          "WWDC 還沒開 但蘋果工程師在 GitHub 上的 commit 已經洩漏 UI 改動。",
          "「動態島」將從小小的黑色區域 擴張為全寬度控制列。",
          "可以顯示多項資訊：音樂、倒數、導航、運動...",
          "甚至可以拖曳 App 進去 變成迷你小工具。",
          "這是自 iOS 7 以來最大的介面改動。",
        ],
        replies: [
          { author: "果粉", body: "終於！動態島卡在原本的位置太浪費了" },
          { author: "UI 設計師", body: "跟 macOS 的 Control Center 融合設計 合理" },
        ],
      },
      {
        tag: "分享",
        title: "Sony PS5 買氣大減！日本銷量竟仍不到初代 Switch 一半",
        body: [
          "發售已經滿 5 年的 PS5 日本累計銷量終於超過 900 萬台。",
          "但 Switch 在同樣 5 年時間內 日本賣出 2300 萬台。",
          "PS5 Pro 的發售似乎也沒帶動明顯買氣。",
          "分析師認為：價格太高 + 獨佔作品少 + 手遊太強",
          "Sony 需要思考如何在日本市場翻身。",
        ],
        replies: [
          { author: "電玩迷", body: "日本一直是任天堂的大本營 不意外" },
          { author: "PS 粉", body: "但歐美市場 PS5 還是稱霸" },
        ],
      },
      {
        tag: "分享",
        title: "最新相機熱銷榜 Top 10 排名出爐 它連霸四個月",
        body: [
          "日本 BCN 官方公佈 2026 年 3 月相機銷量排名：",
          "1. Sony ZV-E10 II（連霸第 4 個月）",
          "2. Canon EOS R50",
          "3. Fujifilm X-T50",
          "4. Sony α7 IV",
          "5. Nikon Z50 II",
          "Vlog 用途的輕量化無反市場持續成長。",
          "高階全幅機種銷量被新入門機種瓜分。",
        ],
        replies: [
          { author: "攝影迷", body: "ZV-E10 II 真的滿強 CP 值高" },
          { author: "富士粉", body: "X-T50 的顏色和手感 APS-C 無敵" },
        ],
      },
      {
        tag: "分享",
        title: "Chrome 爆 108 個駭客惡意外掛 完整名單曝光",
        body: [
          "資安公司 Cisco Talos 揭露 108 個 Chrome 外掛被植入惡意程式。",
          "累計下載超過 3,600 萬次 可能偷取密碼、個資、加密貨幣錢包。",
          "部分外掛看似正常功能（如便簽、翻譯、VPN）",
          "Google 已下架相關外掛 但已安裝的用戶需手動移除。",
          "如何檢查：chrome://extensions/ 對照 Cisco Talos 名單。",
        ],
        replies: [
          { author: "資安人", body: "最近一堆人還在推薦這些外掛...小心" },
          { author: "Chrome 用戶", body: "我已經全部重新檢查了" },
        ],
      },
    ],
  },
  {
    slug: "programming",
    posts: [
      {
        tag: "分享",
        title: "麥當勞 AI 客服竟能解 Python 問題 網友挖出背後是 Claude",
        body: [
          "麥當勞最近上線的 AI 客服被網友「玩壞」發現超級實力。",
          "原本只是接受菜單詢問 有人試著問：「幫我用 Python 寫二分搜尋」",
          "AI 竟然完整寫出來 + 解釋複雜度！",
          "逆向工程師分析 HTTP request 發現後端呼叫 Anthropic Claude API。",
          "麥當勞官方尚未回應 但估計會被要求「限制範圍」",
        ],
        replies: [
          { author: "工程師", body: "Anthropic 的客戶真的越來越多" },
          { author: "AI 觀察", body: "企業用 Claude 做客服成本其實不低" },
          { author: "吃瓜", body: "以後點大麥克還能順便 debug XD" },
        ],
      },
      {
        tag: "發問",
        title: "React Server Components 真的比 SSR 好嗎？",
        body: [
          "最近把公司專案從 Next.js Pages Router 遷移到 App Router。",
          "RSC 概念上很優雅 但實作上遇到一堆坑：",
          "- Client/Server 邊界難管理",
          "- 某些 library 不支援",
          "- Hydration 錯誤比以前更難 debug",
          "有人已經遷移完成嗎？值得投資嗎？",
        ],
        replies: [
          { author: "前端老兵", body: "我們也在掙扎 有些場景 RSC 真的省流量省客戶端 CPU" },
          { author: "full-stack", body: "團隊熟 React 再上 不然 Remix 的路由模型更好懂" },
          { author: "Next.js 控", body: "撐過學習曲線後 真的好用 但前半年很痛苦" },
        ],
      },
      {
        tag: "分享",
        title: "我用 Cursor + Claude 3.7 一個月開發心得",
        body: [
          "背景：10 年 JS 經驗 主要做 React / Node.js。",
          "付費 Cursor Pro ($20/月) + Claude Max ($100/月) 重點摘要：",
          "優：",
          "1. 重構速度快 3 倍 小功能直接給 prompt 就完成",
          "2. 文件撰寫、測試撰寫幾乎不用自己寫",
          "3. 看不熟的 codebase 學習曲線大幅下降",
          "缺：",
          "1. 大改動常改錯 方向，要很仔細審查",
          "2. 偶爾會「自作主張」動到不該動的檔案",
          "3. 偵錯能力還是不如資深工程師",
          "整體推薦指數：9/10 但不要完全依賴",
        ],
        replies: [
          { author: "AI 工具控", body: "Claude 3.7 的程式能力真的跨越門檻了" },
          { author: "CTO", body: "我們團隊試了半年 效率提升 30-50% 值得投資" },
        ],
      },
    ],
  },
  {
    slug: "basketball",
    posts: [
      {
        tag: "NBA",
        title: "「班馬」季後賽首秀轟 35 分寫歷史 馬刺退拓荒者奪首勝",
        body: [
          "Victor Wembanyama 今日迎來生涯首場季後賽登場。",
          "32 分鐘 35 分 10 籃板 5 助攻 3 阻攻 2 抄截",
          "帶領馬刺以 118-112 擊敗拓荒者，取得系列賽首勝。",
          "他成為 21 歲以下球員中 季後賽處女戰第二高分紀錄保持人。",
          "僅次於 1989 年 Magic Johnson 的 38 分。",
          "教練 Mitch Johnson：「他打得像第十季老將」",
        ],
        replies: [
          { author: "馬刺迷", body: "班馬已經是聯盟頂尖了 才第二季" },
          { author: "NBA 觀察", body: "2.24m 能跑能投能護框 未來十年統治級" },
        ],
      },
      {
        tag: "NBA",
        title: "季後賽：約基奇用大三元 率金塊逆轉灰狼奪系列賽首勝",
        body: [
          "季後賽首戰 金塊原本落後灰狼 18 分。",
          "下半場 Jokic 爆發 34 分 14 籃板 13 助攻 大三元收場。",
          "Jamal Murray 也加入 28 分助攻。",
          "最終 121-115 逆轉取勝 系列賽 1-0 領先。",
          "Jokic 賽後：「我們冠軍底蘊在關鍵時刻會發揮」",
        ],
        replies: [
          { author: "Jokic 粉", body: "MVP 級別就是不一樣 關鍵時刻穩" },
          { author: "灰狼球迷", body: "上半場打那麼好下半場...失望" },
        ],
      },
      {
        tag: "PLG",
        title: "獵鷹闖季後賽 例行賽場均 2100 人感謝球迷支持",
        body: [
          "新北獵鷹今天官方宣布確定進入 PLG 季後賽。",
          "例行賽 30 勝 10 敗排名第 3 季後賽將對上新竹攻城獅。",
          "場均進場 2100 人 PLG 第二高。",
          "球團感謝球迷一路支持 季後賽門票明日開賣。",
          "魔獸 Howard 賽季場均 22.5 分 14 籃板。",
        ],
        replies: [
          { author: "獵鷹迷", body: "Howard 真的職業 場場拚命打" },
          { author: "PLG 粉", body: "季後賽對戰組合值得期待" },
        ],
      },
      {
        tag: "NBA",
        title: "詹姆斯生涯 19 度季後賽 平史上第 1",
        body: [
          "LeBron James 今天隨湖人擊敗公鹿 確定第 19 度打進季後賽。",
          "追平 Kareem Abdul-Jabbar 的 NBA 歷史紀錄。",
          "更特別的是 兒子 Bronny 也在名單中。",
          "父子聯手打季後賽 NBA 史上第一對。",
          "LeBron 賽後：「這勝過所有個人成就」",
        ],
        replies: [
          { author: "老詹粉", body: "40 歲還能季後賽 這就是 GOAT" },
          { author: "湖迷", body: "父子同台 畫面已經賺了" },
        ],
      },
    ],
  },
  {
    slug: "baseball",
    posts: [
      {
        tag: "CPBL",
        title: "劉基鴻兩分砲逆轉！龍隊「單局狂灌 6 分」擊退兄弟",
        body: [
          "昨日台中洲際棒球場 中信兄弟對上味全龍經典交鋒。",
          "兄弟先拿 4 分 但 6 局下龍隊大爆發。",
          "劉基鴻對廖健富的曲球揮出兩分砲 瞬間扭轉戰局。",
          "當局龍隊連擊 7 支安打 狂灌 6 分 比數改寫為 6-4。",
          "最終龍隊 8-4 獲勝 本季對兄弟戰績 5-2 領先。",
        ],
        replies: [
          { author: "龍迷", body: "劉基鴻復出表現超讚" },
          { author: "象迷", body: "兄弟牛棚又崩盤 教練該換人了" },
        ],
      },
      {
        tag: "CPBL",
        title: "CPBL：好玄！4/18 沒贏過 富邦悍將今力求終結悲情",
        body: [
          "富邦悍將歷年 4/18 這天戰績：0 勝 7 敗 0 和",
          "連輸 7 年 今天對上樂天桃猿求勝。",
          "總教練陳金鋒：「不相信魔咒 準備好就能贏」",
          "先發投手排定范玉禹 打線增加黃政琇回歸。",
          "樂天則派上劉耀鈞 兩隊都是狀況不錯的投手。",
        ],
        replies: [
          { author: "富邦粉", body: "今年戰績還不錯 應該沒問題" },
          { author: "運動科學", body: "統計樣本太少 不具統計意義但心理有壓力" },
        ],
      },
      {
        tag: "日職",
        title: "徐若熙「相信捕手、全力去投」拚主場首勝",
        body: [
          "旅日投手徐若熙今天將在歐力士主場首度先發。",
          "前兩場登板皆在客場 戰績 1 勝 0 敗 ERA 2.50。",
          "總教練中嶋聰：「他適應速度超乎預期」",
          "徐若熙：「相信捕手 全力去投 結果交給命運」",
          "日本球迷已在社群暱稱他「台灣武士」",
        ],
        replies: [
          { author: "台灣之光", body: "去日本打拚不容易 加油" },
          { author: "棒球迷", body: "徐若熙的沉球真的太會掉 打者很難碰到" },
        ],
      },
      {
        tag: "MLB",
        title: "大谷翔平新「50-50」目標？開季轟 8 轟盜 5 壘氣勢如虹",
        body: [
          "大谷翔平 2026 年開季 15 場 打擊率 .380 / 8 轟 / 5 盜壘。",
          "他的目標是成為史上第一位單季「60-60」球員。",
          "投球方面 雖然還在復健 預計 5 月中旬歸隊。",
          "道奇總教練 Roberts：「他的身體狀況比去年更好」",
          "今年薪資 $7000 萬美金 合約 10 年 $7 億歷史紀錄。",
        ],
        replies: [
          { author: "大谷粉", body: "60-60 根本神蹟 但他有機會" },
          { author: "棒球人", body: "又投又打 真的是從漫畫跑出來的" },
        ],
      },
    ],
  },
];

// ============================================================
// Helper: create fake users
// ============================================================
async function getOrCreateUser(displayName: string) {
  const username = (
    "u_" + displayName.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) ||
    "u_" + Math.random().toString(36).slice(2, 10)
  ).slice(0, 30);
  const email = `${username.toLowerCase()}-jkf@example.local`;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ displayName }, { email }] },
  });
  if (existing) return existing;

  const hash = await bcrypt.hash("Seed123!Aa", 10);
  return prisma.user.create({
    data: {
      email,
      username: username || `u_${Date.now()}${Math.random().toString(36).slice(2,5)}`,
      displayName,
      hashedPassword: hash,
      emailVerified: new Date(),
      role: "USER",
      status: "ACTIVE",
      profile: { create: {} },
      points: {
        create: {
          reputation: Math.floor(Math.random() * 1000),
          coins: Math.floor(Math.random() * 500),
          hearts: Math.floor(Math.random() * 50),
          totalPoints: Math.floor(Math.random() * 1000),
          level: 15 - Math.floor(Math.random() * 5),
        },
      },
    },
  });
}

function slugify(title: string, salt: string): string {
  const clean = title
    .replace(/[\s\[\]「」『』！？。，、…《》（）()【】!?]/g, "")
    .replace(/[^\u4e00-\u9fffA-Za-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${clean}-${salt.slice(-6)}`;
}

async function main() {
  // Get all random users for fake likes/favorites
  const seedUserNames = [
    "小明", "阿華", "Jenny", "Mike", "老王",
    "小美", "阿德", "Chris", "Sarah", "怪怪",
    "dogman", "貓貓", "Kevin88", "YaYa", "火星人",
  ];
  const poolUsers = [];
  for (const name of seedUserNames) {
    poolUsers.push(await getOrCreateUser(name));
  }

  let created = 0;
  let skipped = 0;
  let repliesCreated = 0;
  let likesCreated = 0;
  let favsCreated = 0;

  for (const seed of FORUM_SEEDS) {
    const forum = await prisma.forum.findUnique({ where: { slug: seed.slug } });
    if (!forum) {
      console.log(`[skip] forum not found: ${seed.slug}`);
      continue;
    }
    console.log(`\n=== ${forum.name} (${seed.slug}) ===`);

    for (let i = 0; i < seed.posts.length; i++) {
      const p = seed.posts[i];
      const fullTitle = `[${p.tag}] ${p.title}`;

      const dup = await prisma.post.findFirst({
        where: { forumId: forum.id, title: fullTitle },
      });
      if (dup) {
        skipped++;
        continue;
      }

      const author = await getOrCreateUser(
        p.replies?.[0]?.author || `作者${seed.slug}${i}`
      );

      const htmlBody = p.body
        .map((para) => `<p>${para}</p>`)
        .join("");
      const excerpt = p.body.join(" ").slice(0, 150);
      const createdAt = new Date(
        Date.now() - (i + 1) * (86400000 * (1 + Math.random() * 3))
      );

      const viewCount = Math.floor(Math.random() * 500) + 20;
      const replyCount = p.replies?.length || 0;
      const fakeLikes = Math.floor(Math.random() * 30) + 2;

      const post = await prisma.post.create({
        data: {
          authorId: author.id,
          forumId: forum.id,
          title: fullTitle,
          content: htmlBody,
          excerpt,
          slug: slugify(fullTitle, `${seed.slug}${i}${Date.now()}`),
          status: "PUBLISHED",
          visibility: "PUBLIC",
          viewCount,
          likeCount: fakeLikes,
          replyCount,
          createdAt,
          updatedAt: createdAt,
        },
      });

      // Replies
      if (p.replies) {
        for (let ri = 0; ri < p.replies.length; ri++) {
          const r = p.replies[ri];
          const rAuthor = await getOrCreateUser(r.author);
          await prisma.reply.create({
            data: {
              postId: post.id,
              authorId: rAuthor.id,
              content: r.body,
              likeCount: Math.floor(Math.random() * 8),
              floor: ri + 1,
              createdAt: new Date(createdAt.getTime() + (ri + 1) * 7200000),
            },
          });
          repliesCreated++;
        }
      }

      // Random likes from pool users (up to fakeLikes count, unique)
      const likeUsers = [...poolUsers]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(fakeLikes, poolUsers.length));
      for (const u of likeUsers) {
        await prisma.like
          .create({
            data: { userId: u.id, postId: post.id, isLike: true },
          })
          .then(() => likesCreated++)
          .catch(() => {});
      }

      // Random favorites (30% of posts)
      if (Math.random() < 0.3) {
        const favUsers = [...poolUsers]
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 5) + 1);
        for (const u of favUsers) {
          await prisma.favorite
            .create({ data: { userId: u.id, postId: post.id } })
            .then(() => favsCreated++)
            .catch(() => {});
        }
      }

      created++;
      console.log(`  ✓ ${fullTitle.slice(0, 40)}`);
    }
  }

  console.log(`\n✅ 完成`);
  console.log(`  發文：${created}（跳過 ${skipped} 篇重複）`);
  console.log(`  回覆：${repliesCreated}`);
  console.log(`  按讚：${likesCreated}`);
  console.log(`  收藏：${favsCreated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
