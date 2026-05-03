"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, X, BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Doc = { url: string; type: string; uploadedAt: string };

export function KycUploader({ initial, verified }: { initial: Doc[]; verified: boolean }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Doc[]>(initial);
  const [type, setType] = useState("商業登記");
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("最大 8MB"); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file); fd.set("kind", "kyc");
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await up.json();
      if (!j.success) { toast.error(j.error); return; }
      const next = [...docs, { url: j.data.url, type, uploadedAt: new Date().toISOString() }];
      setDocs(next);
      await save(next);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  async function remove(i: number) {
    const next = docs.filter((_, k) => k !== i);
    setDocs(next);
    await save(next);
  }

  async function save(list: Doc[]) {
    const res = await fetch("/api/business/kyc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docs: list }),
    });
    const j = await res.json();
    if (j.success) {
      toast.success("已儲存（等待管理員審核）");
      router.refresh();
    } else toast.error(j.error);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">📎 KYC 認證文件</h3>
        {verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
            <BadgeCheck className="h-3 w-3" /> 已認證
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">未認證</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        上傳商業登記、身分證、銀行存摺封面等證明文件，管理員審核後通過認證可解鎖提現
      </p>

      {docs.length > 0 && (
        <ul className="space-y-2">
          {docs.map((d, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.url} alt="" className="h-12 w-12 rounded object-cover" />
              <div className="flex-1 text-xs">
                <p className="font-medium">{d.type}</p>
                <p className="text-muted-foreground">{new Date(d.uploadedAt).toLocaleString("zh-TW")}</p>
              </div>
              <button onClick={() => remove(i)} disabled={verified}
                className="rounded p-1 text-muted-foreground hover:text-rose-400 disabled:opacity-30">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!verified && (
        <div className="flex gap-2">
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-xs">
            <option>商業登記</option>
            <option>身分證</option>
            <option>銀行存摺封面</option>
            <option>其他</option>
          </select>
          <Button onClick={() => ref.current?.click()} disabled={busy} variant="outline" size="sm">
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            上傳
          </Button>
        </div>
      )}

      <input ref={ref} type="file" accept="image/*,application/pdf" hidden onChange={handleFile} />
    </div>
  );
}
