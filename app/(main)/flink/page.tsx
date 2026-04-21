import { Link2, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = { title: "友站連結" };

const LINKS: Array<{ category: string; items: Array<{ name: string; url: string; desc?: string }> }> = [
  {
    category: "合作夥伴",
    items: [
      { name: "Brightstream Technology", url: "https://brightstream.example", desc: "本站技術服務商" },
      { name: "RallyGo", url: "https://rally-go.example", desc: "LINE CRM+ERP SaaS" },
    ],
  },
  {
    category: "相關社群",
    items: [
      { name: "Dcard", url: "https://dcard.tw", desc: "年輕世代匿名社群" },
      { name: "PTT BBS", url: "https://www.ptt.cc", desc: "台灣最大 BBS 站" },
      { name: "Mobile01", url: "https://www.mobile01.com", desc: "3C 與生活討論" },
    ],
  },
];

export default function FlinkPage() {
  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <Link2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">友站連結</h1>
          <p className="text-sm text-muted-foreground">
            歡迎合作交流 — 想申請加入請私訊管理員
          </p>
        </div>
      </header>

      {LINKS.map((group) => (
        <section key={group.category}>
          <h2 className="mb-3 text-lg font-semibold">{group.category}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((it) => (
              <a
                key={it.url}
                href={it.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group flex items-start gap-3 rounded-lg border bg-card p-4 transition hover:border-primary/30"
              >
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium group-hover:text-primary">
                    {it.name}
                  </div>
                  {it.desc && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {it.desc}
                    </div>
                  )}
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {new URL(it.url).hostname}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
