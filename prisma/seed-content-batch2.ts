/**
 * Batch 2 seed: add more posts per forum to hit 10+ each.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedPost = {
  tag: string;
  title: string;
  body: string[];
  replies?: { author: string; body: string }[];
};
type ForumSeed = { slug: string; posts: SeedPost[] };

const BATCH: ForumSeed[] = [
  {
    slug: "chitchat",
    posts: [
      {
        tag: "討論",
        title: "最近發現台灣人英文腔越來越重…是錯覺嗎？",
        body: [
          "最近聽街訪、廣告旁白、甚至主播，感覺英文腔比以前重很多。",
          "是因為太多人學美式發音嗎？還是 Podcast / YouTube 影響？",
          "我不是嫌棄，只是覺得「台式英文口音」特色好像快消失了。",
        ],
        replies: [
          { author: "語言學愛好者", body: "媒體影響 + 補習班教法 確實有趨同" },
          { author: "聽感派", body: "聽久了覺得每個人都像 ABC" },
        ],
      },
      {
        tag: "趣事貼",
        title: "我家貓咪看到掃地機器人 當場翻臉",
        body: [
          "以為牠會好奇湊上去玩，結果開機第一秒直接炸毛。",
          "從沙發跳到櫃子 再跳到門上（？）",
          "整整一個月看到掃地機器人就躲起來。",
          "我家狗狗倒是想跟它玩，完全相反個性 XD",
        ],
        replies: [
          { author: "貓奴", body: "我家貓超愛坐在上面讓它載 很會切換" },
          { author: "狗派", body: "狗狗看什麼都想玩 貓貓看什麼都想殺" },
        ],
      },
      {
        tag: "分享",
        title: "30 歲後發現的人生小智慧 TOP 5",
        body: [
          "1. 早點睡 → 勝過任何保養品",
          "2. 別在情緒激動時做決定 → 睡一晚再說",
          "3. 比起賺多少 更要知道自己花多少",
          "4. 遠離讓你不安的人 不管對方多優秀",
          "5. 身體有異狀 立刻去看醫生 別拖",
          "有什麼你自己領悟的也分享看看吧",
        ],
        replies: [
          { author: "過來人", body: "第 2 點超中 我因此避掉很多災難" },
          { author: "30+", body: "#4 最重要 沒有對錯 只有舒不舒服" },
        ],
      },
      {
        tag: "發問",
        title: "大家下班後都做什麼？感覺我的生活太無聊了",
        body: [
          "下班大概 7 點到家，吃完飯洗澡 9 點。",
          "然後就…滑手機到睡覺。",
          "週末也是出門一次就累了，大部分時間在家躺著。",
          "想問大家平日晚上都怎麼過？有什麼充實的活動推薦嗎？",
        ],
        replies: [
          { author: "健身咖", body: "健身房一週 3-4 次 運動完精神變超好" },
          { author: "學習派", body: "線上課 + 讀書 時間過得很快" },
          { author: "懶人", body: "躺也是充電 不用自責" },
        ],
      },
      {
        tag: "分享",
        title: "用 ChatGPT 陪我練英文對話 3 個月心得",
        body: [
          "聽說過但一直沒試，最近真的開始用了。",
          "每天 20 分鐘 跟 ChatGPT 語音對話（它會念出來）",
          "主題設定從點餐、問路、到職場簡報",
          "三個月後跟外國客戶開會明顯更流利",
          "比起補習班便宜太多 有在認真執行就有效",
        ],
        replies: [
          { author: "英文苦手", body: "這招真的讚 沒壓力還免費" },
          { author: "補習班路人", body: "傳統補習班越來越難做 AI 影響很大" },
        ],
      },
      {
        tag: "心情貼",
        title: "今天路上被陌生阿姨送了一把青菜",
        body: [
          "在路邊等紅綠燈 旁邊阿姨塞給我一把空心菜",
          "她說「家裡種太多 給你」就走了",
          "我拿回家煮 真的好吃又甜",
          "原來台灣的人情味還在 只是我們沒發現",
        ],
        replies: [
          { author: "暖心", body: "看了眼眶濕濕的" },
          { author: "鄰居", body: "我阿嬤也是這樣 自己種的就送人" },
        ],
      },
    ],
  },
  {
    slug: "help",
    posts: [
      {
        tag: "發問",
        title: "電腦突然變超慢 開機要 5 分鐘 怎麼辦？",
        body: [
          "使用 Win11 兩年的 SSD 電腦",
          "這週開始開機變得超慢 登入後等任何 App 都要 30 秒",
          "磁碟空間還有 300GB 記憶體也夠",
          "試過關閉啟動程式 也沒改善",
          "有什麼能自己先 check 的嗎？",
        ],
        replies: [
          { author: "IT 仔", body: "打開工作管理員 → 開機 看哪個 App 拖最久" },
          { author: "硬體專", body: "SSD 壽命？可以下載 CrystalDiskInfo 檢查" },
          { author: "系統救援", body: "試試 sfc /scannow 修復系統檔" },
        ],
      },
      {
        tag: "發問",
        title: "車子被刮了 想找人修 比價去哪裡找？",
        body: [
          "上週在停車場車門被刮了一道約 15cm 的痕",
          "保險有但不想動到自費額",
          "修車廠一間一間跑估價很累",
          "有沒有線上比價平台？",
        ],
        replies: [
          { author: "汽車大賣場", body: "汽車小幫手 App 可以傳照片估價" },
          { author: "老司機", body: "臉書地區性汽車社團發照片 會有人報價" },
        ],
      },
      {
        tag: "求助",
        title: "長輩被詐騙了 5 萬 該怎麼處理？",
        body: [
          "我媽昨天被假冒檢察官電話騙了 5 萬。",
          "錢已經匯出去 銀行說無法追回。",
          "她現在整個人很沮喪 自責到睡不著。",
          "除了報警 還有什麼可以做的嗎？",
        ],
        replies: [
          { author: "律師", body: "撥 165 做筆錄 + 銀行凍結對方帳戶程序" },
          { author: "心理師", body: "被騙不是你媽的錯 別讓她自責 多陪伴" },
          { author: "過來人", body: "我家人也被騙過 錢很難追 預防比較重要" },
        ],
      },
    ],
  },
  {
    slug: "food",
    posts: [
      {
        tag: "分享",
        title: "隱藏版早餐！台南「石舂臼牛肉湯」凌晨 4 點排隊",
        body: [
          "去台南一定要吃牛肉湯 大家都知道",
          "但在地人才會去「石舂臼」 凌晨 4 點開 排到早上 10 點收攤",
          "溫體牛肉薄薄一片 湯頭清甜不膩",
          "配他們自己發酵的米血糕 $120 的小確幸",
          "位置在石精臼廣場 不要走錯店",
        ],
        replies: [
          { author: "台南人", body: "石舂臼是神店 4 點真的誇張" },
          { author: "美食家", body: "拍到月亮跟牛肉湯的照片很酷" },
        ],
      },
      {
        tag: "分享",
        title: "家裡三個月沒外食省下 4 萬 自煮菜單公開",
        body: [
          "挑戰「三個月全自煮」 結果真的省下 4 萬。",
          "每週固定菜色：",
          "週一：蔥油雞 + 蒸蛋",
          "週二：番茄牛肉麵",
          "週三：照燒豬排 + 燙青菜",
          "週四：咖哩飯",
          "週五：義大利麵",
          "週末：火鍋 / 外出一餐",
          "食材每週 $1500 4 口之家",
        ],
        replies: [
          { author: "主婦", body: "週末再外食很聰明 不會膩" },
          { author: "單身", body: "一人分量拿捏比較難" },
        ],
      },
      {
        tag: "討論",
        title: "牛肉麵該加辣椒嗎？資深麵迷吵翻天",
        body: [
          "有朋友說「加辣椒 = 破壞湯頭」，我覺得紅油辣椒提升層次啊。",
          "你們吃牛肉麵會加料嗎？",
          "辣椒 / 醋 / 酸菜 / 蔥花 / 香菜…",
          "哪些是合理的 哪些踩雷？",
        ],
        replies: [
          { author: "純湯派", body: "清燉我不加任何料 紅燒才加辣椒" },
          { author: "多料派", body: "酸菜必加！畫龍點睛" },
          { author: "和平", body: "各人喜好 別說人家破壞什麼" },
        ],
      },
    ],
  },
  {
    slug: "travel",
    posts: [
      {
        tag: "分享",
        title: "沖繩 5 天自駕 CP 值超高 詳細攻略",
        body: [
          "2 大 1 小 沖繩 5 天 4 夜自駕 總預算 NT$48,000",
          "機票 $8,000 / 人（虎航促銷）",
          "住宿 恩納村海景飯店 $2,800 / 晚",
          "租車 5 天 $6,500 ETC 過路費另算",
          "必去：美國村 / 古宇利島 / 沖繩美麗海水族館",
          "必吃：塔可飯 / 山原島豬 / 紅芋 BLUE SEAL 冰淇淋",
          "小孩超愛水族館 老婆超愛 OUTLET",
        ],
        replies: [
          { author: "親子遊", body: "感謝分享 我也規劃要帶小孩去" },
          { author: "沖繩控", body: "自駕真的最方便 大眾運輸很弱" },
        ],
      },
      {
        tag: "分享",
        title: "台東比想像中好玩！5 個私房秘境推薦",
        body: [
          "上週去台東玩了 4 天 完全顛覆印象",
          "1. 加路蘭遊憩區 — 海浪 + 漂流木藝術",
          "2. 三仙台拱橋 — 日出絕美 5 點起床值得",
          "3. 多良車站 — 全台最美車站",
          "4. 知本溫泉 — 山區秘境湯屋",
          "5. 鹿野高台 — 熱氣球季必去",
          "建議自駕 大眾運輸班次少",
        ],
        replies: [
          { author: "東部迷", body: "多良車站真的美 IG 網紅景點" },
          { author: "攝影師", body: "三仙台日出 + 拱橋 隨便拍都是作品" },
        ],
      },
    ],
  },
  {
    slug: "entertainment",
    posts: [
      {
        tag: "分享",
        title: "《鬼滅之刃》無限城篇預告上線 炭治郎 vs 猗窩座終極決戰",
        body: [
          "電影版《鬼滅之刃 無限城篇》釋出最終預告。",
          "炭治郎聯手義勇要對上上弦之三猗窩座。",
          "預告重現原作幾個經典畫面：",
          "- 義勇死守無言的孤獨",
          "- 猗窩座揭露生前回憶",
          "- 炭治郎赫刀覺醒瞬間",
          "台灣上映日期：2026/7/18",
        ],
        replies: [
          { author: "鬼滅迷", body: "義勇回憶篇希望有完整呈現" },
          { author: "動畫粉", body: "ufotable 的作畫品質 進電影院支持" },
        ],
      },
      {
        tag: "討論",
        title: "最近追什麼韓劇？推薦或防雷都歡迎",
        body: [
          "上一部《淚之女王》追完後就沒有新劇讓我驚艷",
          "看了幾部新檔但都看不下去",
          "有沒有最近劇情緊湊、不拖戲的推薦？",
          "類型不限 但不要太虐",
        ],
        replies: [
          { author: "韓劇達人", body: "《魷魚遊戲 3》快上 先補 2 季" },
          { author: "浪漫派", body: "《海街日記》改編韓版 很療癒" },
          { author: "刑偵控", body: "《財閥 x 刑警》節奏快 推" },
        ],
      },
    ],
  },
  {
    slug: "world-news",
    posts: [
      {
        tag: "國際",
        title: "歐盟通過新規 2035 年禁售全新燃油車",
        body: [
          "歐洲議會昨日通過具法律效力的禁售法規。",
          "2035 年起 歐盟境內不得銷售「全新」燃油車與油電混合車。",
          "僅允許電動車與合成燃料車。",
          "現有燃油車可繼續使用 二手交易不受限。",
          "部分車廠如 BMW、Mercedes 表示支持轉型路線圖。",
        ],
        replies: [
          { author: "環保派", body: "終於有具體時間表" },
          { author: "車迷", body: "燃油車會變成古董收藏品" },
        ],
      },
      {
        tag: "國際",
        title: "美國通膨再降溫 Fed 本月可能連續 3 次降息",
        body: [
          "美國 3 月 CPI 年增率降至 2.1%",
          "接近 Fed 的 2% 長期目標。",
          "市場預期本月 FOMC 將再次降息 1 碼",
          "創連續 3 次降息紀錄",
          "美股四大指數全面走高 台股跟漲。",
        ],
        replies: [
          { author: "財經迷", body: "升降息循環太快 股市跟不上" },
          { author: "股民", body: "終於可以買 0050 了" },
        ],
      },
    ],
  },
  {
    slug: "politics",
    posts: [
      {
        tag: "議題",
        title: "能源轉型卡關？核三重啟公投民調 5 成支持",
        body: [
          "近期民調顯示 關於「是否重啟核三」題目 49.8% 支持、38.2% 反對。",
          "主要支持理由：電力穩定、減碳、電價壓力。",
          "反對理由：核廢料、地震、替代能源有發展空間。",
          "本會期立法院將討論 能源政策引發新一輪辯論。",
        ],
        replies: [
          { author: "能源觀察", body: "現實是用電吃緊 核電是短期解方" },
          { author: "綠能派", body: "應該加速太陽能 + 離岸風電布建" },
          { author: "理性派", body: "兩邊都要做 不能二選一" },
        ],
      },
      {
        tag: "議題",
        title: "勞退新制自提 6% 該不該？網友兩派激戰",
        body: [
          "勞退新制雇主強制 6%，勞工可「自願」再提 6% 免稅。",
          "支持派：退休金多一層保障 省稅",
          "反對派：年輕時需要現金流、勞退投資報酬率低",
          "你的做法是什麼？有提多少？",
        ],
        replies: [
          { author: "年輕族", body: "我沒提 現金流重要" },
          { author: "中壯年", body: "40 歲開始提 存退休金" },
          { author: "ETF 派", body: "與其提勞退 不如自己買 VOO" },
        ],
      },
    ],
  },
  {
    slug: "mobile",
    posts: [
      {
        tag: "開箱",
        title: "Galaxy Z Fold 7 使用 1 個月心得 到底值不值？",
        body: [
          "折疊機玩家 從 Fold 2 用到現在",
          "Fold 7 最大改進：更輕（239g）、鉸鏈更穩、相機升級",
          "內螢幕 7.6 吋 看影片追劇真的超爽",
          "缺點：折痕還是有、價格 NT$68,900 嚇人、保護殼選擇少",
          "推給：常常看大螢幕內容 / 重度多工 / 口袋預算充足者",
        ],
        replies: [
          { author: "折疊控", body: "Fold 7 真的是集大成" },
          { author: "果粉", body: "這價錢買 iPhone Pro Max 還有剩" },
        ],
      },
      {
        tag: "討論",
        title: "小米 15 Ultra 拍照真的超越 iPhone 了嗎？",
        body: [
          "看了國外幾個測評 小米 15 Ultra 的相機評分都排在 iPhone 17 Pro Max 前面。",
          "DXOMARK 分數也超越了。",
          "但實際使用下來 很多人說顏色太「小米味」",
          "你們覺得分數 vs 實感 哪個重要？",
        ],
        replies: [
          { author: "攝影魂", body: "DXOMARK 只是參考 順手最重要" },
          { author: "小米用戶", body: "小米拍照 10 年從黑轉白 可以" },
        ],
      },
    ],
  },
  {
    slug: "hardware",
    posts: [
      {
        tag: "分享",
        title: "RTX 5090 測試出爐 1440p 遊戲性能爆表",
        body: [
          "NVIDIA 官方跟外媒測試解禁。",
          "RTX 5090 vs 4090：",
          "- 4K 光追：+35%",
          "- 1440p 純光柵：+22%",
          "- DLSS 4 開啟：+60%（幀生成加強）",
          "但功耗也提高到 600W 需要新電源線。",
          "MSRP $1999 美金 台灣首波定價預估 NT$72,900。",
        ],
        replies: [
          { author: "硬體狂", body: "4090 直接變中古貨 殘酷啊" },
          { author: "省錢派", body: "這價錢買車都可以了..." },
        ],
      },
      {
        tag: "分享",
        title: "AMD Ryzen 9 9950X3D 評測：遊戲效能稱霸但要注意",
        body: [
          "AMD 最新 Zen 5 + 3D V-Cache 旗艦登場。",
          "遊戲性能：平均比 9950X 高 15-25%、比 Intel i9-14900K 高 10%。",
          "但生產力表現略遜 9950X（因為頻率稍低）。",
          "TDP 170W 散熱需要至少 360 一體水冷。",
          "建議：純遊戲玩家選 X3D、遊戲 + 創作選 9950X。",
        ],
        replies: [
          { author: "DIY", body: "X3D 在微星 B850 搭 DDR5-6000 最順" },
          { author: "工作站", body: "生產力還是 Intel + RAM 多一點穩" },
        ],
      },
    ],
  },
  {
    slug: "programming",
    posts: [
      {
        tag: "分享",
        title: "我用 TypeScript 重寫 10 年 Perl 專案的心得",
        body: [
          "公司有一個 2015 年就存在的 Perl 專案 每年維護成本超高。",
          "我主動提議用 TypeScript 重寫 花了 6 個月。",
          "過程：",
          "1. 先寫完整 E2E 測試 覆蓋原本行為",
          "2. 一個模組一個模組重寫 + 單元測試",
          "3. 平行運行兩版本驗證一致性",
          "結果：CI 時間從 12 分鐘降到 3 分鐘、bug 減少 70%。",
          "最大收穫：type safety + IDE 支援改變開發體驗。",
        ],
        replies: [
          { author: "TS 控", body: "typesafe 救一命 動態語言大型專案痛苦" },
          { author: "老 Perl 人", body: "Perl 其實還有他的優勢 看專案" },
          { author: "PM", body: "6 個月重寫 老闆怎麼答應的" },
        ],
      },
      {
        tag: "發問",
        title: "Go vs Rust 後端用哪個比較好？新手求解",
        body: [
          "想轉後端 上過 Python / Node.js 但想學編譯型語言。",
          "Go 和 Rust 都聽說過 但不知道選哪個。",
          "使用情境：新創公司 RESTful API + 少量 gRPC",
          "長遠想學系統程式設計 / 區塊鏈",
          "兩者的學習曲線差多少？",
        ],
        replies: [
          { author: "Go 派", body: "Go 語法簡單 生態完整 後端首選" },
          { author: "Rust 狂", body: "Rust 學習曲線陡 但值得 語言設計精妙" },
          { author: "PM 視角", body: "新創用 Go 起步快 Rust 適合效能極致" },
        ],
      },
    ],
  },
  {
    slug: "basketball",
    posts: [
      {
        tag: "NBA",
        title: "雷納德生涯第 14 季改寫得分新高 聯盟史上第一人",
        body: [
          "快艇 Kawhi Leonard 今晚轟下 47 分、11 籃板。",
          "打破他生涯單場得分紀錄 同時也是聯盟 34 歲以上球員最高分。",
          "他成為 NBA 史上第一位 在第 14 季還能改寫得分高的球星。",
          "快艇贏下與拓荒者比賽 系列賽 2-1 領先。",
          "Kawhi：「我只是專注每一球 數據不重要」",
        ],
        replies: [
          { author: "快艇迷", body: "34 歲的健康真的就是他最大武器" },
          { author: "NBA", body: "越老越強 真的不是每個人都能做到" },
        ],
      },
      {
        tag: "P.LEAGUE+",
        title: "PLG 總冠軍賽火藥味十足！攻城獅 vs 鋼鐵人",
        body: [
          "例行賽冠軍鋼鐵人 對上季後賽黑馬攻城獅",
          "首戰 4/25 新莊體育館",
          "鋼鐵人 Howard 場均 22+14、攻城獅 Caleb 25+6+8",
          "門票 20 分鐘內完售 二手票炒到 4 倍價",
          "這可能是 PLG 史上最熱的總冠軍賽",
        ],
        replies: [
          { author: "PLG 鐵粉", body: "這兩隊打起來絕對精彩" },
          { author: "新竹人", body: "新竹主場 Feel 會被鋼鐵人壓著打" },
        ],
      },
    ],
  },
  {
    slug: "baseball",
    posts: [
      {
        tag: "CPBL",
        title: "中職開季票房衝高 單月觀眾破 40 萬創紀錄",
        body: [
          "中華職棒聯盟公布 開季 3 週票房。",
          "累計觀眾人次 40.8 萬 比去年同期 +35%。",
          "最大功臣：新球場洲際、台鋼雄鷹首年、大物選手如林昱珉等。",
          "單場最高：4/13 中信兄弟 vs 味全龍 20,163 人爆滿。",
          "CPBL 會長：目標年度 300 萬人次。",
        ],
        replies: [
          { author: "棒球迷", body: "台灣棒球真的進入黃金時代" },
          { author: "球迷", body: "票房好 球員待遇也會變好" },
        ],
      },
      {
        tag: "MLB",
        title: "山本由伸 8 局無失分完封勇士 道奇 5-0 拿下勝利",
        body: [
          "日本王牌山本由伸今日主投 8 局。",
          "被打 3 安打、8 K、0 BB、0 ER",
          "搭配大谷、Betts 打線連發 道奇 5-0 擊敗勇士。",
          "山本本季戰績 4 勝 0 敗 ERA 1.85",
          "賽揚獎討論已經開始浮現。",
        ],
        replies: [
          { author: "大谷粉", body: "Shohei 有神隊友 打起來更穩" },
          { author: "投手控", body: "山本由伸的曲球真的無敵" },
        ],
      },
    ],
  },
];

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
          reputation: Math.floor(Math.random() * 1500),
          coins: Math.floor(Math.random() * 800),
          hearts: Math.floor(Math.random() * 100),
          totalPoints: Math.floor(Math.random() * 1500),
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
  const poolNames = [
    "RayRay", "小安", "凱文", "Cindy", "Peter",
    "阿偉", "老王2號", "DogFan", "貓耳朵", "Anna",
    "小資少女", "運動達人", "美食獵人", "技術宅", "文青",
  ];
  const pool = [];
  for (const n of poolNames) pool.push(await getOrCreateUser(n));

  let created = 0, replies = 0, likes = 0, favs = 0;

  for (const seed of BATCH) {
    const forum = await prisma.forum.findUnique({ where: { slug: seed.slug } });
    if (!forum) continue;
    console.log(`\n=== ${forum.name} ===`);

    for (let i = 0; i < seed.posts.length; i++) {
      const p = seed.posts[i];
      const fullTitle = `[${p.tag}] ${p.title}`;
      const dup = await prisma.post.findFirst({ where: { forumId: forum.id, title: fullTitle }});
      if (dup) continue;

      const author = await getOrCreateUser(p.replies?.[0]?.author || `${seed.slug}作者${i}`);
      const htmlBody = p.body.map(para => `<p>${para}</p>`).join("");
      const excerpt = p.body.join(" ").slice(0, 150);
      const createdAt = new Date(Date.now() - (i + 1) * (86400000 * (0.5 + Math.random() * 2)));

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
          viewCount: Math.floor(Math.random() * 800) + 30,
          likeCount: Math.floor(Math.random() * 40) + 3,
          replyCount: p.replies?.length || 0,
          createdAt,
          updatedAt: createdAt,
        },
      });

      if (p.replies) {
        for (let ri = 0; ri < p.replies.length; ri++) {
          const r = p.replies[ri];
          const rAuthor = await getOrCreateUser(r.author);
          await prisma.reply.create({
            data: {
              postId: post.id,
              authorId: rAuthor.id,
              content: r.body,
              likeCount: Math.floor(Math.random() * 10),
              floor: ri + 1,
              createdAt: new Date(createdAt.getTime() + (ri + 1) * 7200000),
            },
          });
          replies++;
        }
      }

      const likeUsers = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(post.likeCount, pool.length));
      for (const u of likeUsers) {
        await prisma.like.create({ data: { userId: u.id, postId: post.id, isLike: true }})
          .then(() => likes++).catch(() => {});
      }

      if (Math.random() < 0.35) {
        const favUsers = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 5) + 1);
        for (const u of favUsers) {
          await prisma.favorite.create({ data: { userId: u.id, postId: post.id }})
            .then(() => favs++).catch(() => {});
        }
      }
      created++;
      console.log(`  ✓ ${fullTitle.slice(0, 40)}`);
    }
  }

  console.log(`\n✅ 新增：${created} 篇 / ${replies} 回覆 / ${likes} 讚 / ${favs} 收藏`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
