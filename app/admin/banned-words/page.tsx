/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db";
import { ShieldAlert } from "lucide-react";
import { BannedWordsManager } from "@/components/admin/banned-words-manager";

export const dynamic = "force-dynamic";

export default async function AdminBannedWordsPage() {
  const list = await db.bannedWord.findMany({
    orderBy: [{ severity: "desc" }, { word: "asc" }],
    take: 500,
  });
  return (
    <div className="space-y-4">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ShieldAlert className="h-7 w-7 text-rose-400" /> 敏感詞庫
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          BLOCK：發布攔截 ｜ FLAG：自動 *** 替換但允許發布
        </p>
      </header>
      <BannedWordsManager initial={list as any} />
    </div>
  );
}
