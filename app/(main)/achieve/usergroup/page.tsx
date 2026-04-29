import { GROUPS, PERMISSION_MATRIX } from "@/lib/user-groups";

export const metadata = { title: "會員組權限 | JKForum" };

const PERM_LABEL: Record<keyof typeof PERMISSION_MATRIX, string> = {
  POST_CREATE: "發文",
  REPLY_CREATE: "回覆",
  HIDDEN_POST_CREATE: "發隱藏帖",
  PAID_POST_CREATE: "發付費帖",
  VIP_POST_CREATE: "發 VIP 帖",
  POLL_CREATE: "建投票帖",
  POST_RATE: "評分文章",
  TIP_OTHERS: "打賞他人",
  CHAT_SEND: "聊天室發言",
  CHAT_R18: "R-18 聊天室發言",
  FORUM_FOLLOW: "追蹤版區",
  CREATE_BLOG: "建立個人日誌",
};

export default function UserGroupPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">📋 會員組權限</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          18 層會員組，依累計發文 / 名聲 / 註冊天數自動升等。VIP 由訂閱觸發；版主、站長由管理員指派。
        </p>
      </header>

      {/* 等級階梯 */}
      <section>
        <h2 className="mb-3 text-lg font-bold">等級階梯</h2>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">等級</th>
                <th className="px-3 py-2 text-right">閱讀權限</th>
                <th className="px-3 py-2 text-right">發文需求</th>
                <th className="px-3 py-2 text-right">名聲需求</th>
                <th className="px-3 py-2 text-right">註冊天數</th>
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((g) => (
                <tr key={g.group} className="border-t">
                  <td className="px-3 py-2">
                    {g.iconEmoji} {g.label}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{g.readPower}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {g.reqPosts ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {g.reqReputation ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {g.reqDays ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 權限矩陣 */}
      <section>
        <h2 className="mb-3 text-lg font-bold">權限門檻</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(PERMISSION_MATRIX).map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
            >
              <span>{PERM_LABEL[k as keyof typeof PERMISSION_MATRIX]}</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                ≥ {v.minReadPower}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
