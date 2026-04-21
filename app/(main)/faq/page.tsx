import { HelpCircle } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "常見問題 FAQ",
  description: "JKForum 常見問題與客服指引",
};

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
}

const FAQ: FaqCategory[] = [
  {
    id: "account",
    title: "帳號與會員",
    items: [
      {
        q: "如何註冊帳號？",
        a: "點擊右上角「註冊」，輸入信箱、暱稱、密碼即可完成註冊。系統會發送驗證信到你的信箱。",
      },
      {
        q: "忘記密碼怎麼辦？",
        a: "在登入頁點擊「忘記密碼」，輸入註冊信箱，會收到重設連結。",
      },
      {
        q: "如何開啟雙因素認證（MFA）？",
        a: "進入「設定 > 雙因素認證」頁面，用 Google Authenticator 掃 QR code 即可。啟用後會得到 10 組備用碼，請妥善保存。",
      },
      {
        q: "如何變更暱稱或頭像？",
        a: "設定 > 個人資料 內可修改。變更頭像 +5 名聲、變更簽名檔 +10 名聲（一次性）。",
      },
    ],
  },
  {
    id: "points",
    title: "積分與等級",
    items: [
      {
        q: "有哪些積分類型？",
        a: "8 類：名聲、金幣、白金幣、愛心、寶石、送出、體力、邀請。各有用途，詳見「我的積分」頁。",
      },
      {
        q: "如何獲得金幣？",
        a: "每日登入 +10、簽到 +20（連續加乘）、發文 +2、被打賞等。完整規則在「我的積分 > 積分策略」。",
      },
      {
        q: "等級怎麼升？",
        a: "總積分累積自動升級。從平民（0）到皇帝（1M+）共 18 級。",
      },
      {
        q: "體力用途？",
        a: "體力每日登入 +1，上限 100。未來會用於挖礦、探索等遊戲中心功能。",
      },
    ],
  },
  {
    id: "content",
    title: "文章與互動",
    items: [
      {
        q: "什麼是隱藏文？",
        a: "作者設定的文章類型 — 讀者必須先回覆才能看到完整內容。",
      },
      {
        q: "付費文章怎麼解鎖？",
        a: "點文章內的解鎖按鈕，花費指定金幣即可永久解鎖。80% 金幣會分給作者。",
      },
      {
        q: "閱讀權限是什麼？",
        a: "部分文章有閱讀權限下限（例如 50），需達到對應等級才能瀏覽。等級越高、閱讀權限越高。",
      },
      {
        q: "打賞規則？",
        a: "每篇文章可打賞 10/50/100/500/1000 金幣。作者獲得 80%。打賞可累積名聲與互動分數。",
      },
    ],
  },
  {
    id: "vip",
    title: "VIP 與付費",
    items: [
      {
        q: "VIP 有什麼權益？",
        a: "專屬標識、雙倍簽到、VIP 限定內容、專屬勳章、優先客服、每月贈品。詳情看 /vip。",
      },
      {
        q: "付款方式？",
        a: "目前為 Demo 環境。正式版將整合 ECPay / NewebPay / Stripe。",
      },
      {
        q: "可以取消訂閱嗎？",
        a: "可以。取消後不會再自動續費，但已訂閱的期間仍可使用。",
      },
    ],
  },
  {
    id: "moderation",
    title: "違規與檢舉",
    items: [
      {
        q: "如何檢舉違規內容？",
        a: "在文章或回覆點擊「檢舉」，選擇類別並填寫原因。管理員會在 24 小時內處理。",
      },
      {
        q: "被封鎖了怎麼辦？",
        a: "查看通知頁的封鎖原因。若認為誤判，請私訊管理團隊或透過客服信箱申訴。",
      },
      {
        q: "社群守則在哪？",
        a: "請參閱「服務條款」。違規行為包括：色情（非 R18 分級）、暴力、人身攻擊、詐騙、違法資訊等。",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">常見問題 FAQ</h1>
          <p className="text-sm text-muted-foreground">
            找不到答案？私訊管理員或寄信至 support@jkforum.example
          </p>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 border-b pb-4">
        {FAQ.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="rounded-full border bg-card px-3 py-1 text-sm hover:border-primary hover:text-primary"
          >
            {c.title}
          </a>
        ))}
      </nav>

      <div className="space-y-8">
        {FAQ.map((c) => (
          <section key={c.id} id={c.id}>
            <h2 className="mb-3 text-lg font-semibold">{c.title}</h2>
            <div className="space-y-2">
              {c.items.map((it, i) => (
                <details
                  key={i}
                  className="group rounded-lg border bg-card p-4"
                >
                  <summary className="cursor-pointer list-none font-medium hover:text-primary">
                    <span className="mr-2 inline-block w-5 rotate-0 transition-transform group-open:rotate-90">
                      ›
                    </span>
                    {it.q}
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
                    {it.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
