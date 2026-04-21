/**
 * Batch 3 seed - fill remaining forums to 10+ posts each
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

const FORUM_TAGS: Record<string, string> = {
  chitchat: "coffee,lifestyle", feelings: "couple,love", help: "computer,help",
  food: "food,taiwan", travel: "travel,japan", entertainment: "cinema,movie",
  "world-news": "news,world", "taiwan-news": "taipei,taiwan", politics: "government,building",
  mobile: "smartphone,tech", hardware: "computer,gaming", programming: "code,laptop",
  basketball: "basketball,sports", baseball: "baseball,stadium",
};

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
};

const cover = (slug: string, id: string) =>
  `https://loremflickr.com/800/500/${FORUM_TAGS[slug] || "photo"}?lock=${Math.abs(hash(id)) % 1000}`;

const BATCH: ForumSeed[] = [
  {
    slug: "travel",
    posts: [
      {
        tag: "分享",
        title: "京阪神 7 天自由行 所有車票懶人包",
        body: [
          "JR 關西廣域鐵路周遊券 5 天 $9,000 — 適合去姬路 / 和歌山",
          "大阪周遊卡 1 日 $500 — 免費入場 40 個景點",
          "京都 巴士 1 日券 $700 — 京都主要景點都通",
          "神戶地鐵 1 日券 $600",
          "全部組合起來比 JR Pass 省很多",
        ],
        replies: [
          { author: "日本通", body: "關西廣域 CP 真高 推" },
          { author: "省錢派", body: "京都其實用腳走就很夠" },
        ],
      },
      {
        tag: "發問",
        title: "第一次出國 新加坡 vs 日本該選哪個？",
        body: [
          "明年想帶老婆出國度蜜月 預算 8 萬 / 2 人 / 5 天",
          "新加坡語言通、但很熱；日本景點多、但語言有障礙",
          "大家建議先去哪個？",
        ],
        replies: [
          { author: "新加坡迷", body: "新加坡 3 天就夠 日本可以安排 5 天" },
          { author: "日本控", body: "第一次出國 日本文化衝擊剛好" },
        ],
      },
      {
        tag: "其他",
        title: "阿里山賞櫻 vs 日本賞櫻 經驗比較",
        body: [
          "這兩年都去了 分享差別",
          "阿里山：吉野櫻 + 八重櫻、3 月中旬、人潮爆炸、門票 $150",
          "日本京都：八重櫻等多品種、3 月底到 4 月中、各地分散、免費",
          "結論：想省錢就阿里山 想拍美照就日本",
        ],
        replies: [
          { author: "攝影師", body: "京都哲學之道的櫻花隧道真的無敵" },
          { author: "台灣玩家", body: "阿里山小火車 + 櫻花也是絕配" },
        ],
      },
      {
        tag: "分享",
        title: "泰國清邁 5 天 $18,000 手把手攻略",
        body: [
          "機票 $6,000（亞航）、住宿 $800/晚、美食 $300/天、按摩 $400/次",
          "必去：大塔寺、週日夜市、雙龍寺、寧曼路咖啡街",
          "必吃：Khao Soi、芒果糯米飯、泰式咖哩",
          "交通：租機車 $300/天 + Grab",
        ],
        replies: [
          { author: "背包客", body: "清邁的咖啡店真的好多又好喝" },
          { author: "愛玩家", body: "週日夜市 5 點就要去卡位" },
        ],
      },
      {
        tag: "發問",
        title: "冰島自駕環島 行程該順時針還是逆時針？",
        body: [
          "10 月去冰島 租車環島 10 天",
          "看了一堆攻略 有說順時針有說逆時針",
          "到底哪個比較好？主要想看極光 + 冰河 + 黑沙灘",
        ],
        replies: [
          { author: "冰島控", body: "順時針 先去黃金圈消化時差 最後到東南部看冰河" },
          { author: "極光獵人", body: "主要看天氣 極光隨機不用綁順序" },
        ],
      },
      {
        tag: "分享",
        title: "宜蘭溫泉 3 天 2 夜小確幸行程",
        body: [
          "第一天：羅東夜市 → 礁溪住宿",
          "第二天：湯圍溝溫泉公園 → 金車咖啡 → 蘭陽博物館",
          "第三天：龜山島觀鯨 → 國立傳藝中心",
          "總花費 2 人 $9,500 包含高檔湯屋",
        ],
        replies: [
          { author: "宜蘭人", body: "推薦加一個「頭城老街」很有味道" },
          { author: "溫泉迷", body: "湯圍溝冬天去最舒服" },
        ],
      },
    ],
  },
  {
    slug: "taiwan-news",
    posts: [
      {
        tag: "生活",
        title: "氣象署宣布：今年入夏延後 5 月底才會「正式」入夏",
        body: [
          "中央氣象署昨公布入夏日期。",
          "今年全台平均氣溫達到 28 度 C 的日期 預估是 5 月下旬。",
          "相較往年晚了約 1-2 週。",
          "原因與反聖嬰現象有關 春末氣溫偏低。",
          "提醒民眾早晚溫差大 注意衣著。",
        ],
        replies: [
          { author: "氣象迷", body: "最近早上真的還有點涼" },
          { author: "過敏族", body: "溫差大就是我鼻炎的季節..." },
        ],
      },
      {
        tag: "綜合",
        title: "台鐵新自強號 3000 型上路 高乘載舒適度獲好評",
        body: [
          "台鐵最新車型「EMU3000」昨天正式投入東部幹線營運。",
          "最大亮點：全車插座 + 免費 Wi-Fi + 更大椅距。",
          "乘客實測回饋：「比傳統自強號安靜多了」",
          "目前共 50 列 明年將全面替換舊型車。",
        ],
        replies: [
          { author: "東部人", body: "終於等到 台鐵進步好多" },
          { author: "鐵道迷", body: "椅距真的舒服 高個子不擠腿" },
        ],
      },
      {
        tag: "綜合",
        title: "全台便利商店咖啡大戰開打 7-11 小杯拿鐵降到 $35",
        body: [
          "7-11 今天推出限時新優惠。",
          "中杯拿鐵 $55、小杯 $35，3 個月。",
          "全家立刻跟進 City Cafe 同價位相同促銷。",
          "萊爾富、OK 尚未公布應對方案。",
          "上班族福音 但咖啡店老闆哀嚎。",
        ],
        replies: [
          { author: "咖啡族", body: "$35 太便宜了 天天可以喝" },
          { author: "精品咖啡", body: "便利店好喝到獨立咖啡店很難做" },
        ],
      },
      {
        tag: "生活",
        title: "台北捷運新設計「無障礙月台」試辦",
        body: [
          "台北捷運公司宣布 先期在信義線 4 個站點設置「無障礙等候區」。",
          "有視覺、聽覺、行動輔具的乘客可優先進入月台車廂。",
          "感應式語音指引 + 專屬座位",
          "預計 6 月全面實施。",
        ],
        replies: [
          { author: "通勤族", body: "這是很棒的設計 支持" },
          { author: "設計師", body: "無障礙應該是標配 不該是「設計」" },
        ],
      },
      {
        tag: "綜合",
        title: "全聯推「會員週年慶」100 元現金券免費領",
        body: [
          "全聯即日起到 5/15",
          "只要是 PX Pay 會員 累積消費滿 $500 就送 $100 現金券。",
          "可用於下次購物 不限品項。",
          "去年活動吸引 300 萬人參與。",
          "全聯總部預估今年參與人數上看 400 萬。",
        ],
        replies: [
          { author: "全聯婆婆", body: "我每天都在全聯買 賺起來" },
          { author: "精明消費", body: "全聯的會員制做得比好市多還強" },
        ],
      },
      {
        tag: "科技",
        title: "台灣 Google Wallet 將新增身分證功能",
        body: [
          "內政部與 Google 合作",
          "2026 年底前 Google Wallet 台灣版可支援「數位身分證」。",
          "預計可用於：申辦銀行、進出機場、部分醫療院所。",
          "隱私權團體：「資料交給美國公司真的安全嗎？」",
          "政府回應：所有資料仍存於台灣境內。",
        ],
        replies: [
          { author: "隱私派", body: "數位化好 但要確認資料主權" },
          { author: "便利派", body: "不用帶實體證件 方便多了" },
        ],
      },
      {
        tag: "娛樂",
        title: "金馬獎入圍名單公布 女主角 5 強競爭激烈",
        body: [
          "第 62 屆金馬獎入圍名單今天揭曉。",
          "女主角：楊貴媚、賈靜雯、張榕容、謝盈萱、陳姸霏",
          "男主角：張孝全、王柏傑、陳竹昇、柯宇綸、鳳小岳",
          "最佳劇情片：《女孩》、《孤獨島》、《金毛》等",
          "11/21 臺北流行音樂中心頒獎",
        ],
        replies: [
          { author: "影迷", body: "這屆女主角競爭超激烈 每個都強" },
          { author: "金馬控", body: "張孝全好久沒入圍了 期待" },
        ],
      },
    ],
  },
  {
    slug: "politics",
    posts: [
      {
        tag: "議題",
        title: "立法院通過「電力自由化」 民間發電廠可直賣企業",
        body: [
          "《電業法》修法三讀通過。",
          "再生能源發電廠未來可直接賣電給企業用戶。",
          "企業買綠電更方便 不用透過台電。",
          "環保團體：是減碳重要一步",
          "台電：短期衝擊財務但長遠支持",
        ],
        replies: [
          { author: "綠能派", body: "這是正確方向 逼企業負責減碳" },
          { author: "財務分析", body: "台電財務已經赤字 再衝擊營收怎麼辦" },
        ],
      },
      {
        tag: "議題",
        title: "同志婚姻 5 週年回顧：3.8 萬對結婚、離婚率 12%",
        body: [
          "2019 年台灣成為亞洲第一個同性婚姻合法化國家。",
          "5 年來共 3.8 萬對同性伴侶登記結婚",
          "離婚率 12% 低於異性婚姻的 22%",
          "最大挑戰：跨國婚姻、收養制度仍有限制",
        ],
        replies: [
          { author: "彩虹旗", body: "大家的婚姻都一樣有喜有悲" },
          { author: "法律系", body: "跨國婚姻限制應該要放寬" },
        ],
      },
      {
        tag: "議題",
        title: "健保改革公開討論會 部分負擔上限是否調整？",
        body: [
          "衛福部明日舉辦公開討論會 討論健保負擔調整。",
          "目前門診部分負擔最低 $50 最高 $420",
          "提案：無醫療上限之重大傷病者 調整負擔上限",
          "民間團體反對：會造成弱勢醫療負擔",
          "醫界支持：避免資源浪費",
        ],
        replies: [
          { author: "慢性病患", body: "上限要考慮弱勢 不能一刀切" },
          { author: "健保專家", body: "不改 2031 年真的會破產" },
        ],
      },
      {
        tag: "議題",
        title: "警察「數位蒐證」新規上路 民眾手機可被依法檢查",
        body: [
          "《刑事訴訟法》修正案昨天上路。",
          "警察可在合法搜索範圍內 要求查看民眾手機。",
          "必須：書面令狀 + 正當程序 + 全程錄影",
          "民間反彈：隱私權受影響",
          "警方：只針對重大案件",
        ],
        replies: [
          { author: "法律系", body: "有程序正當就 OK" },
          { author: "隱私派", body: "口頭容易走樣 執行方式要監督" },
        ],
      },
      {
        tag: "議題",
        title: "立委提案：公務員全面週休三日 引發激辯",
        body: [
          "一位立委日前提案「全面週休三日」",
          "試辦公務員先行 若成效好推廣到民間。",
          "支持派：生產力不減、生活品質提升、鼓勵消費",
          "反對派：公部門效率更低、民間跟不上",
          "國際案例：比利時、冰島試行成果正面",
        ],
        replies: [
          { author: "上班族", body: "夢都不敢做... 但若成真太棒" },
          { author: "老闆", body: "中小企業撐不起 大公司或許可以" },
        ],
      },
    ],
  },
  {
    slug: "feelings",
    posts: [
      {
        tag: "討論",
        title: "女友每年生日都要 10 萬以上的禮物...",
        body: [
          "交往第 3 年 第一年送化妝品 第二年送包包 第三年送她「想要車」",
          "她說「你要真的愛我就做得到」",
          "我月薪 45K 已經被禮物花光積蓄",
          "這真的是正常的情侶關係嗎？",
        ],
        replies: [
          { author: "經濟派", body: "禮物價值不是重點 是比較心態有問題" },
          { author: "過來人", body: "分手吧 這種期望會越來越難滿足" },
          { author: "和平", body: "可以溝通 設定兩人都能接受的額度" },
        ],
      },
      {
        tag: "討論",
        title: "發現老公加班都是去看前女友 該怎麼辦",
        body: [
          "結婚 8 年 2 個小孩。昨天看到他手機。",
          "跟前女友的對話裡 提到上週「老地方見」",
          "時間剛好是他說「公司加班」那天。",
          "我現在整個人不知道該怎麼面對明天。",
        ],
        replies: [
          { author: "婚姻顧問", body: "先冷靜 收集證據 考慮諮商" },
          { author: "女生", body: "孩子是最大考量 但別忍氣吞聲" },
          { author: "律師", body: "現在起記錄所有證據 必要時用得到" },
          { author: "支持", body: "加油 妳不是一個人" },
        ],
      },
      {
        tag: "發問",
        title: "怎麼判斷對方喜不喜歡你？",
        body: [
          "跟一個女生曖昧 2 個月",
          "她會回訊息 但主動很少",
          "邀她出去 3 次有 2 次說有事",
          "這是「她沒興趣」還是「她在等我繼續努力」？",
        ],
        replies: [
          { author: "感情達人", body: "3 次有 2 次拒絕 通常就是禮貌婉拒" },
          { author: "過來人", body: "直接問她 省下曖昧的時間與心力" },
          { author: "女生視角", body: "真有興趣 主動約會第一次就答應" },
        ],
      },
      {
        tag: "心理學",
        title: "「情感勒索」的 5 個徵兆 你的關係健康嗎？",
        body: [
          "1. 對方常說「你不做就是不愛我」",
          "2. 用自殘或威脅情緒逼你讓步",
          "3. 切斷你與朋友家人的聯繫",
          "4. 讓你對自己產生罪惡感",
          "5. 拒絕理性溝通 只用情緒回應",
          "如果有 2 個以上 建議諮詢心理師。",
        ],
        replies: [
          { author: "心理師", body: "很好的整理 分享給需要的人" },
          { author: "過來人", body: "我以前就是中了 好險後來逃出來" },
        ],
      },
      {
        tag: "求助",
        title: "跟男友吵架後他就消失 3 天不回訊息",
        body: [
          "因為小事吵架 沒什麼大不了的",
          "他一氣之下 3 天完全不回訊息",
          "我擔心他發生事 也擔心他真的不愛我了",
          "這種「冷戰」正常嗎？該等還是主動？",
        ],
        replies: [
          { author: "和平派", body: "主動一次 確認狀況 之後看他反應" },
          { author: "冷戰派", body: "每次都妳主動 以後他會習慣這樣處理" },
          { author: "心理師", body: "成人不用冷戰 直接溝通 需要練習" },
        ],
      },
    ],
  },
  {
    slug: "help",
    posts: [
      {
        tag: "發問",
        title: "停車被撞沒留下聯絡方式 車禍行人找不到怎麼辦？",
        body: [
          "車停在公共路邊 早上發現保險桿被撞了",
          "對方沒留條子也沒聯絡",
          "路邊監視器可以調嗎？要怎麼處理？",
          "保險會賠嗎？",
        ],
        replies: [
          { author: "交警", body: "報案 + 向交通局申請監視器 要 48 小時內" },
          { author: "保險業", body: "自己保險可以先走理賠 追不到肇事者時" },
        ],
      },
      {
        tag: "求助",
        title: "家裡老鼠一直抓不到 快瘋了",
        body: [
          "搬家到舊公寓 3 個月 晚上一直聽到老鼠聲",
          "放過黏鼠板、捕鼠器、驅鼠器 都沒用",
          "想請專業除蟲但一次 $5000 以上",
          "有沒有其他方法？",
        ],
        replies: [
          { author: "滅鼠師", body: "找鼠巢是關鍵 通常在牆壁孔洞" },
          { author: "老鼠剋星", body: "活捉籠 + 誘餌（花生醬）效率最高" },
        ],
      },
      {
        tag: "發問",
        title: "想買電動牙刷 Philips 和 Oral-B 差在哪？",
        body: [
          "第一次買電動牙刷 預算 $3000 以內",
          "看 Philips Sonicare 和 Oral-B 最推薦",
          "清潔方式不一樣（聲波 vs 旋轉）",
          "實用上哪個比較好用？",
        ],
        replies: [
          { author: "牙醫", body: "兩個都 OK 習慣最重要 要刷得夠久" },
          { author: "用戶 A", body: "Philips 聲波比較溫和 適合牙齦敏感" },
        ],
      },
    ],
  },
  {
    slug: "food",
    posts: [
      {
        tag: "分享",
        title: "這家台中日式燒肉 真材實料老闆親自夾肉",
        body: [
          "位於台中七期 招牌是 A5 和牛雙饗套餐",
          "一位 $1,800 有 5 種肉類 + 海鮮 + 無限飲料",
          "老闆親自為每桌顧客烤肉 每片都精準熟度",
          "要訂位提前 3 天 假日常滿",
        ],
        replies: [
          { author: "肉食派", body: "A5 這個價錢真的划算" },
          { author: "美食家", body: "老闆烤的真的有差 服務滿分" },
        ],
      },
      {
        tag: "討論",
        title: "大家覺得「珍珠奶茶」哪一家最好喝？",
        body: [
          "經典問題但還是想問。",
          "我自己喜歡「老虎堂」的黑糖鮮奶",
          "朋友說非「五桐號」莫屬",
          "你們各地最愛哪一家？",
        ],
        replies: [
          { author: "珍珠控", body: "小林珍奶永遠的神 便宜又好喝" },
          { author: "文青", body: "金魚眼的手工粉圓無敵" },
          { author: "北部人", body: "50 嵐波霸 經典不敗" },
        ],
      },
      {
        tag: "分享",
        title: "在家做「簡單版牛肉麵」不用紅燒粉",
        body: [
          "食材：牛腱 1 公斤、蔥薑蒜、豆瓣醬、番茄 2 顆、八角 3 個、冰糖",
          "作法：牛肉汆燙 → 爆香辛香料 → 加入豆瓣醬 → 番茄 → 水 → 小火燉 2 小時",
          "重點是豆瓣醬 + 番茄的組合 紅燒粉可以不用",
          "最後用麵條 + 酸菜 就是一碗好吃的牛肉麵",
        ],
        replies: [
          { author: "家庭主婦", body: "我下次試試 番茄真的很神奇" },
          { author: "牛肉麵控", body: "燉 2 小時 肉會更軟" },
        ],
      },
    ],
  },
  {
    slug: "entertainment",
    posts: [
      {
        tag: "分享",
        title: "《庫洛魔法使 CLEAR CARD 季》劇場版確定 6 月上映",
        body: [
          "20 週年特別企劃！",
          "劇場版《庫洛魔法使 Clear Card 最終章》將於 6/15 在日本上映",
          "台灣預計 7 月跟進",
          "據悉故事接續 TV 版結局 小櫻 vs 神秘新對手",
          "官方公佈主題曲由 CLAMP 好友坂本真綾演唱",
        ],
        replies: [
          { author: "動漫迷", body: "等了好久 一定要進戲院" },
          { author: "80 後", body: "情懷殺 想到國小追看小櫻的時光" },
        ],
      },
      {
        tag: "討論",
        title: "哈利波特 HBO 影集進度曝光 重點演員陸續確定",
        body: [
          "HBO 宣布《哈利波特》影集已開始選角",
          "哈利波特：未成年小演員 Alastair Stout",
          "妙麗：Arabella Stanton",
          "榮恩：Dominic McLaughlin",
          "導演、編劇團隊都由 J.K. Rowling 親自監修",
          "預計 2027 年播出 每一集對應一本書",
        ],
        replies: [
          { author: "魔法迷", body: "這小演員臉型真的像哈利" },
          { author: "老粉", body: "不換角 不敢看原著作者認可的版本" },
        ],
      },
      {
        tag: "分享",
        title: "《灌籃高手 電影版 2》確定製作 鄉田彰入團風波重現",
        body: [
          "井上雄彥老師親自證實 續作已正式開始製作",
          "劇情將延續第一部之後 上屆全國大賽後期",
          "最受期待：鄉田彰入團的篇章（陵南）",
          "預計 2027-2028 上映",
        ],
        replies: [
          { author: "灌籃高手迷", body: "山王打敗後還有湘北 vs 愛和高中" },
          { author: "動漫製作", body: "東映動畫 + 3D 風格 期待" },
        ],
      },
      {
        tag: "討論",
        title: "最近看了哪部電影 讓你起雞皮疙瘩？",
        body: [
          "最近看了《鴉殺》韓國電影 真的神",
          "主角的心理轉折 + 視覺設計",
          "Netflix 上有 推薦",
          "你們最近看了什麼不錯的？",
        ],
        replies: [
          { author: "Netflix 迷", body: "《怪奇物語 5》等很久了" },
          { author: "韓粉", body: "《地獄公使 2》也不錯" },
          { author: "影迷", body: "《奧本海默》重看還是震撼" },
        ],
      },
    ],
  },
  {
    slug: "mobile",
    posts: [
      {
        tag: "開箱",
        title: "Pixel 10 Pro 使用一週 AI 功能真的進化很多",
        body: [
          "Google 總算把 Gemini 整合做好了",
          "亮點功能：",
          "- Magic Eraser 2 — AI 去除路人 + 修復背景，幾乎看不出 PS",
          "- Call Screen — 自動接陌生電話、過濾廣告",
          "- Voice Recorder 即時翻譯 + 自動生成摘要",
          "- Pixel Fold 可以直接跑 Gemini Nano 本地 AI",
          "缺點：電池還是不夠用 台灣定價 $35,900 Max 版",
        ],
        replies: [
          { author: "Pixel 粉", body: "Call Screen 是我換 Pixel 的主要原因" },
          { author: "Android 控", body: "Gemini 本地跑 是未來方向" },
        ],
      },
      {
        tag: "發問",
        title: "iPhone 16 要入手嗎？還是等 17？",
        body: [
          "iPhone 13 用 3 年了 電池 80%",
          "iPhone 16 便宜 + 已上市",
          "iPhone 17 即將 9 月發表 Camera Control 據說升級",
          "大家會等 17 還是直接 16？",
        ],
        replies: [
          { author: "果粉", body: "等 17 發表後 16 會降價 兩邊都划算" },
          { author: "不等", body: "手機是工具 趕快換 爽用一年" },
          { author: "比較派", body: "16 是成熟版 17 是首代新功能機 看取捨" },
        ],
      },
      {
        tag: "分享",
        title: "折疊機過了三年 我為什麼選擇換回直立機",
        body: [
          "Galaxy Fold 3 → Fold 4 → Fold 5",
          "問題：",
          "1. 折痕越用越明顯",
          "2. 外螢幕太窄 單手打字累",
          "3. 想看大螢幕 不如直接用平板",
          "4. 掉到地上兩次螢幕就是保修",
          "最後換成 S25 Ultra 反而覺得輕鬆",
        ],
        replies: [
          { author: "折疊控", body: "Fold 7 聽說折痕幾乎沒了 要再試" },
          { author: "務實派", body: "折疊機就是多一個賣點 真的好用？因人而異" },
        ],
      },
      {
        tag: "討論",
        title: "手機電池壽命 5 年後還能用？",
        body: [
          "iPhone 13 用滿 3 年了 電池 82%",
          "手機廠說換電池 $2,500",
          "外面第三方 $1,200",
          "值得換嗎？還是直接換新機？",
        ],
        replies: [
          { author: "維修工", body: "還能用就換 80% 以下才有感差異" },
          { author: "節省派", body: "一支手機用到不能用 環保又省錢" },
        ],
      },
      {
        tag: "分享",
        title: "Realme GT7 Pro 評測 中階旗艦殺手",
        body: [
          "高通 8 Gen 3 + 16GB 記憶體 + 5800mAh 電池",
          "1.5K 螢幕 + 超窄邊框",
          "120W 快充 10 分鐘滿電",
          "台灣售價 $21,900 128GB 版",
          "CP 值相較 S24 / iPhone 16 非常有感",
        ],
        replies: [
          { author: "硬體控", body: "Realme 這幾年真的殺出血路" },
          { author: "原神族", body: "5800mAh 打原神不擔心" },
        ],
      },
    ],
  },
  {
    slug: "hardware",
    posts: [
      {
        tag: "分享",
        title: "AMD 宣布 Ryzen AI Max 台灣上市 14 吋筆電即將搭載",
        body: [
          "AMD 今天在台北發表新一代 Ryzen AI Max 行動處理器",
          "亮點：NPU 算力達到 55 TOPS 超越 Intel Lunar Lake",
          "首批搭載機種：ASUS Zenbook / HP Spectre / Lenovo",
          "預計 5 月底開賣 $45,000 起",
          "Copilot+ PC 認證 所有 AI 功能都能跑本地",
        ],
        replies: [
          { author: "硬體控", body: "55 TOPS 超高 Intel 要加油了" },
          { author: "AI 用戶", body: "本地跑 AI 才是未來 不用每次聯網" },
        ],
      },
      {
        tag: "發問",
        title: "組一台 CP 值最高的遊戲主機 $50K 怎麼配？",
        body: [
          "主要玩 AAA 3A 遊戲 + 偶爾做影像後製",
          "4K 不求 1440p 穩定就好",
          "大家建議怎麼配？",
        ],
        replies: [
          { author: "DIY 專家", body: "5600X3D + 4070 Super + 32GB DDR5 約 $48K 完美" },
          { author: "AMD 派", body: "7800X3D 效能更強 但預算會超一點" },
          { author: "二手行家", body: "二手 4080 約 $23K 組機預算剩很多" },
        ],
      },
      {
        tag: "分享",
        title: "SSD 4TB 掉到 $5,000 以下 現在是入手時機？",
        body: [
          "WD Black SN850X 4TB 最新促銷 $4,988 (Amazon)",
          "去年同價位只能買 2TB",
          "PS5 / PC 升級都很實用",
          "建議這波手刀 預計下半年漲回去",
        ],
        replies: [
          { author: "儲存控", body: "已經下單 4TB 省事多了" },
          { author: "省錢派", body: "2TB x2 比 4TB x1 還便宜 但槽有限" },
        ],
      },
      {
        tag: "分享",
        title: "Intel Arc B580 顯卡測試 中階 CP 值好貨",
        body: [
          "Intel 新一代 Battlemage 顯卡登場",
          "B580 效能約等於 RTX 4060 + 50%",
          "台灣定價 $9,500 比 RTX 4060 便宜 $1,500",
          "唯一問題：驅動程式仍在優化 部分遊戲卡頓",
          "等 1-2 版更新後值得入手",
        ],
        replies: [
          { author: "Intel 迷", body: "Intel 加油 NVIDIA 壟斷太久" },
          { author: "省錢 DIY", body: "等穩定了一定入手" },
        ],
      },
      {
        tag: "發問",
        title: "44 吋 vs 55 吋 客廳電視怎麼選？",
        body: [
          "客廳 3 米 x 4 米 沙發距電視 2.5 米",
          "44 吋：省空間，但看電影不夠震撼",
          "55 吋：沉浸感好，但擺放空間要預留",
          "各位怎麼選的？",
        ],
        replies: [
          { author: "影音迷", body: "2.5 米絕對選 55 吋 不用怕" },
          { author: "小宅主", body: "55 吋要買升降壁掛 省空間" },
        ],
      },
    ],
  },
  {
    slug: "programming",
    posts: [
      {
        tag: "分享",
        title: "從 Vue 3 遷移到 React 19 的心路歷程",
        body: [
          "公司前端原本是 Vue 3 + Pinia",
          "為了人才招募 + 生態系 決定遷移到 React 19",
          "遷移過程：",
          "1. 寫 codemod 自動轉 template 到 JSX",
          "2. Composable → Custom Hook 的模式",
          "3. Pinia store 改成 Zustand",
          "4. Vue Router → Next.js App Router",
          "耗時 3 個月 團隊 5 人 完整替換",
          "心得：React 生態系真的大但學習曲線比 Vue 陡",
        ],
        replies: [
          { author: "前端大叔", body: "兩邊都用過 Vue 開發起來更快 React 生態更穩" },
          { author: "Full Stack", body: "遷移這種工程 值不值得因團隊而異" },
        ],
      },
      {
        tag: "發問",
        title: "Postgres 還是 MySQL？新創 API 服務該選哪個？",
        body: [
          "新創 MVP 預估 3 個月內 10 萬 user",
          "主要 CRUD + 少量 JSON field + 簡單 analytics",
          "Postgres 生態強 但維運略複雜",
          "MySQL 便宜好部署 但 JSON 支援弱",
          "大家的推薦？",
        ],
        replies: [
          { author: "DBA", body: "Postgres 絕對選 JSONB + extension 吊打 MySQL" },
          { author: "新創人", body: "我們是 MySQL 因為 RDS 便宜 管理方便" },
          { author: "ORM 派", body: "用 Prisma / Drizzle 兩邊都能切 選你熟的" },
        ],
      },
      {
        tag: "分享",
        title: "用 Bun 取代 Node.js 的 6 個月心得",
        body: [
          "原本 Node.js 18 的 monorepo 改用 Bun 1.1",
          "優：",
          "- npm install 快 10 倍",
          "- 內建 test runner 不用 Jest",
          "- TypeScript 直接跑 不用 tsx / ts-node",
          "缺：",
          "- 生態系 package 相容性偶爾有問題",
          "- debugger 工具不如 Node 成熟",
          "- 生產環境還是跑 Node（還不敢用 Bun production）",
        ],
        replies: [
          { author: "效能控", body: "開發環境用 Bun 真的爽 快翻倍" },
          { author: "穩定派", body: "Production 用 Bun 還是要再等等" },
        ],
      },
      {
        tag: "分享",
        title: "我用 Claude Code 2 個月開發 SaaS 產品的體驗",
        body: [
          "背景：獨立開發者 15 年經驗",
          "目標：2 個月上線一個 B2B SaaS",
          "用工具：Claude Code + Cursor + Linear",
          "結果：真的做到了 MVP 上線 已收到 3 個付費用戶",
          "關鍵：不要完全依賴 AI 大方向還是要自己決定",
          "AI 最擅長：寫樣板、寫測試、寫文件、refactor",
        ],
        replies: [
          { author: "indie hacker", body: "indie hacker 的黃金時代來了" },
          { author: "SaaS 創業", body: "2 個月做出收費產品 真的厲害" },
        ],
      },
      {
        tag: "發問",
        title: "Docker Compose 還是 Kubernetes？小團隊 20 人該上哪個？",
        body: [
          "目前 Docker Compose 3 台伺服器",
          "想要 自動擴容 + CI/CD 整合",
          "公司 20 人 後端 5 位",
          "K8s 學習曲線高 + 運維成本",
          "Docker Swarm / Nomad 也是選項",
          "值得上 K8s 嗎？",
        ],
        replies: [
          { author: "SRE", body: "20 人 K8s 其實划不來 建議用 AWS ECS / Cloud Run" },
          { author: "雲端控", body: "服務 < 10 個不要上 K8s 白白增加複雜度" },
          { author: "K8s 迷", body: "早點上 長遠好 學會受用終生" },
        ],
      },
    ],
  },
  {
    slug: "basketball",
    posts: [
      {
        tag: "NBA",
        title: "季後賽首輪預測 各系列誰能晉級？",
        body: [
          "東區：",
          "1. 賽爾提克 vs 騎士 — 賽爾提克 4-2",
          "2. 公鹿 vs 尼克 — 尼克 4-3",
          "3. 活塞 vs 雷霆 — 雷霆 4-1",
          "4. 七六人 vs 熱火 — 七六人 4-2",
          "西區分析下一樓回覆",
        ],
        replies: [
          { author: "綠軍迷", body: "綠軍絕對回到總冠軍" },
          { author: "NY 粉", body: "尼克 vs 公鹿 真的打得很好" },
        ],
      },
      {
        tag: "PLG",
        title: "楊敬敏延長合約 3 年 場均還有 18 分",
        body: [
          "台啤永豐雲豹宣布與資深球員楊敬敏延長合約",
          "3 年 $4000 萬 包含附加條件",
          "他已 37 歲但場均仍有 18 分 + 3 助攻",
          "隊伍長期發展計畫一環 也擔任隊友導師",
        ],
        replies: [
          { author: "台啤迷", body: "老將對球隊文化的貢獻真的重要" },
          { author: "PLG 觀察", body: "37 歲還能上陣 保養真的好" },
        ],
      },
      {
        tag: "討論",
        title: "Kobe vs Jordan 誰比較強？永恆辯論",
        body: [
          "三成以下：Jordan 防守吊打",
          "出手選擇：Jordan 關鍵球效率更高",
          "技術面：Kobe 更細膩多樣",
          "綜合來看 Jordan 略勝",
          "但 Kobe 的 Mamba Mentality 影響後來無數球員",
        ],
        replies: [
          { author: "老球迷", body: "時代不同 數據會錯覺 真的要看錄影" },
          { author: "Kobe 迷", body: "Kobe 的低位腳步無人能出其右" },
        ],
      },
      {
        tag: "NBA",
        title: "總冠軍預測：賽爾提克 vs 雷霆？",
        body: [
          "目前兩隊都是各區第 1 種子",
          "賽爾提克 Tatum + Brown 得分組合",
          "雷霆 SGA 得分王 + 年輕防守軍團",
          "如果真能在總冠軍相遇 肯定是精彩的七戰",
          "你認為誰會拿冠？",
        ],
        replies: [
          { author: "東區迷", body: "綠軍經驗 + 陣容更厚 絕對衛冕" },
          { author: "西區狂", body: "雷霆年輕 + 銳氣 可能爆冷" },
        ],
      },
    ],
  },
  {
    slug: "baseball",
    posts: [
      {
        tag: "CPBL",
        title: "味全龍陳金鋒決定退休 Farewell 演唱會訂於 8 月",
        body: [
          "46 歲的陳金鋒今天宣布本季結束後退休",
          "20 年職棒生涯 4,000 打席、542 安打、87 轟",
          "最著名時刻：2008 年北京奧運致勝安打",
          "Farewell 演唱會 8/15 洲際球場登場",
          "「我對棒球的愛 會用其他方式繼續」",
        ],
        replies: [
          { author: "鋒哥迷", body: "阿鋒退休會哭爆 一個時代結束" },
          { author: "老球迷", body: "一輩子只待一支球隊 真的是傳奇" },
        ],
      },
      {
        tag: "CPBL",
        title: "台鋼雄鷹首年戰績超預期 新球隊最大功臣是誰？",
        body: [
          "入職聯盟首年 20 勝 15 敗 排名第 4",
          "最大功臣：總教練洪一中的調度",
          "新人王候選：林昱珉 .310 / 15 轟 / 45 打點",
          "外援強勢：第三梯次投手群 ERA 平均 3.2",
          "台鋼老闆投入資金 + 專業管理 看到成果",
        ],
        replies: [
          { author: "台鋼迷", body: "洪總還是寶刀未老" },
          { author: "新球迷", body: "林昱珉是下一個大物 值得期待" },
        ],
      },
      {
        tag: "MLB",
        title: "大谷翔平 vs Judge 本壘打王之爭 誰會贏？",
        body: [
          "開季統計（15 場）",
          "大谷翔平：8 HR / 17 RBI / .380 BA",
          "Aaron Judge：6 HR / 14 RBI / .320 BA",
          "兩大巨星今年都在巔峰狀態",
          "本壘打王之爭必定白熱化",
        ],
        replies: [
          { author: "大谷粉", body: "大谷今年 + 投球 真的太強" },
          { author: "洋基迷", body: "Judge 下半季會飆起來 不要小看" },
        ],
      },
      {
        tag: "CPBL",
        title: "中職金手套獎提名名單出爐 兄弟獨佔 4 位",
        body: [
          "各位置提名：",
          "捕手：林智勝（兄弟）、蘇俊璋（龍）",
          "一壘：楊明勳（兄弟）、林安可（獅）",
          "二壘：胡金龍（兄弟）、高國麟（桃猿）",
          "投票截止 5/10",
          "兄弟內野真的穩定",
        ],
        replies: [
          { author: "象迷", body: "兄弟防守今年確實提升" },
          { author: "獅迷", body: "林安可的一壘守備真的標準" },
        ],
      },
    ],
  },
  {
    slug: "world-news",
    posts: [
      {
        tag: "國際",
        title: "美股大跌後反彈 Fed 表態「必要時會繼續降息」",
        body: [
          "上週美股單週跌 3.5% 創近 6 個月最大跌幅",
          "週一 Fed 主席鮑威爾公開發言「隨時準備出手」",
          "4 小時內 S&P 500 反彈 2.1% 收復大部分跌幅",
          "市場預期 5 月將繼續降息 1 碼",
          "美元指數下跌 資金流向新興市場",
        ],
        replies: [
          { author: "投資客", body: "鮑威爾這招 拉一把就穩了" },
          { author: "財經迷", body: "美國經濟還是很有韌性" },
        ],
      },
      {
        tag: "國際",
        title: "中國第一位 AI 作家出書 被質疑原創性",
        body: [
          "上海一出版社推出完全由 AI 生成的長篇小說",
          "作者署名為 GPT-Shanghai-007",
          "內容 450 頁 花 48 小時生成",
          "爭議：版權歸誰？AI 能算「作者」嗎？",
          "文學界反應兩極",
        ],
        replies: [
          { author: "AI 愛好", body: "時代在變 傳統文學要跟上" },
          { author: "文學派", body: "AI 寫作缺乏靈魂 還是模仿而已" },
        ],
      },
      {
        tag: "國際",
        title: "歐盟通過「AI 高風險法規」2027 年生效",
        body: [
          "歐盟議會正式通過全球首個 AI 法規",
          "風險分級：",
          "- 不可接受（禁用）：社會評分系統",
          "- 高風險（強規範）：醫療、教育、就業 AI",
          "- 有限風險（透明度）：聊天機器人",
          "- 最小風險（自由）：遊戲、娛樂 AI",
          "2027 年 6 月全面生效",
        ],
        replies: [
          { author: "AI 開發者", body: "這是必要的規範 好事" },
          { author: "歐洲科技", body: "對歐洲 AI 產業發展是好是壞 時間會告訴" },
        ],
      },
      {
        tag: "國際",
        title: "加拿大與美國貿易談判破裂 加徵關稅 25%",
        body: [
          "加拿大總理特魯多宣布",
          "對美國汽車、農產品加徵 25% 報復性關稅",
          "起因：美國單方面對加拿大木材課徵反傾銷稅",
          "兩國貿易戰升溫",
          "影響：汽車、農產品、木業價格預期上漲",
        ],
        replies: [
          { author: "貿易觀察", body: "全球保護主義捲土重來" },
          { author: "消費者", body: "最終都是我們買單" },
        ],
      },
    ],
  },
];

async function getOrCreateUser(displayName: string) {
  const username = ("u_" + displayName.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) ||
    "u_" + Math.random().toString(36).slice(2, 10)).slice(0, 30);
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
  const pool: any[] = [];
  const poolNames = ["小花", "阿傑", "Linda", "文青女", "科技宅", "NBA魂", "咖啡迷", "日本通", "省錢老王", "電腦狂"];
  for (const n of poolNames) pool.push(await getOrCreateUser(n));

  let created = 0, replies = 0, likes = 0, favs = 0;

  for (const seed of BATCH) {
    const forum = await prisma.forum.findUnique({ where: { slug: seed.slug } });
    if (!forum) continue;
    console.log(`\n=== ${forum.name} ===`);

    for (let i = 0; i < seed.posts.length; i++) {
      const p = seed.posts[i];
      const fullTitle = `[${p.tag}] ${p.title}`;
      const dup = await prisma.post.findFirst({ where: { forumId: forum.id, title: fullTitle } });
      if (dup) continue;

      const author = await getOrCreateUser(p.replies?.[0]?.author || `${seed.slug}作者${i}`);
      const postId = `${seed.slug}${i}${Date.now()}`;
      const coverImg = cover(seed.slug, postId);
      const htmlBody =
        `<p><img src="${coverImg}" alt="" class="cover-img" /></p>` +
        p.body.map(para => `<p>${para}</p>`).join("");
      const excerpt = p.body.join(" ").slice(0, 150);
      const createdAt = new Date(Date.now() - (i + 1) * (86400000 * (0.5 + Math.random() * 2)));

      const post = await prisma.post.create({
        data: {
          authorId: author.id,
          forumId: forum.id,
          title: fullTitle,
          content: htmlBody,
          excerpt,
          slug: slugify(fullTitle, postId),
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
        await prisma.like.create({ data: { userId: u.id, postId: post.id, isLike: true } })
          .then(() => likes++).catch(() => {});
      }

      if (Math.random() < 0.35) {
        const favUsers = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 5) + 1);
        for (const u of favUsers) {
          await prisma.favorite.create({ data: { userId: u.id, postId: post.id } })
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
