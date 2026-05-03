import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowLeft, Download } from "lucide-react";
import { formatNumber, timeAgo } from "@/lib/utils/format";
import { DownloadButton } from "@/components/downloads/download-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const r = await db.downloadResource.findUnique({ where: { id: params.id }, select: { title: true } });
  return { title: r ? `${r.title} | 下載` : "下載" };
}

export default async function DownloadDetailPage({ params }: { params: { id: string } }) {
  const r = await db.downloadResource.findUnique({ where: { id: params.id } });
  if (!r || !r.isActive) notFound();

  const uploader = await db.user.findUnique({
    where: { id: r.uploaderId },
    select: { id: true, displayName: true, username: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/downloads" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        返回下載專區
      </Link>

      {r.thumbnailUrl && (
        <div
          className="h-56 rounded-xl bg-cover bg-center"
          style={{ backgroundImage: `url(${r.thumbnailUrl})` }}
        />
      )}

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {r.category}
          </span>
          {r.isFeatured && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
              ⭐ 精選
            </span>
          )}
          {r.requiresVip && (
            <span className="rounded-full bg-fuchsia-500/90 px-2 py-0.5 text-xs font-bold text-white">
              VIP 限定
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold">{r.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          {uploader && (
            <Link href={`/profile/${uploader.id}`} className="hover:text-primary">
              @{uploader.username}
            </Link>
          )}
          <span>·</span>
          <span><Download className="mr-1 inline h-3 w-3" />{formatNumber(r.downloadCount)} 次下載</span>
          <span>·</span>
          <span>{timeAgo(r.createdAt)}</span>
        </div>
      </header>

      {r.description && (
        <div className="rounded-xl border bg-card p-4">
          <p className="whitespace-pre-line text-sm">{r.description}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-3 text-sm">
          <div className="text-xs text-muted-foreground">檔案大小</div>
          <div className="mt-1 font-bold">
            {r.fileSize >= 1024 ** 2
              ? `${(r.fileSize / 1024 ** 2).toFixed(1)} MB`
              : `${(r.fileSize / 1024).toFixed(1)} KB`}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-sm">
          <div className="text-xs text-muted-foreground">類型</div>
          <div className="mt-1 font-bold">{r.fileType ?? "—"}</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-sm">
          <div className="text-xs text-muted-foreground">所需閱讀權限</div>
          <div className="mt-1 font-bold">≥ {r.minReadPower}</div>
        </div>
      </div>

      <DownloadButton
        resourceId={r.id}
        costCredits={r.costCredits}
        costCoins={r.costCoins}
        title={r.title}
      />
    </div>
  );
}
