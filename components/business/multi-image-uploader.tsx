"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MAX_IMAGES = 8;
const MAX_SIZE = 5 * 1024 * 1024;

export function MultiImageUploader({
  value, onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (value.length + files.length > MAX_IMAGES) {
      toast.error(`最多 ${MAX_IMAGES} 張`);
      return;
    }
    setBusy(true);
    const newUrls: string[] = [];
    try {
      for (const file of files) {
        if (file.size > MAX_SIZE) { toast.error(`${file.name} 超過 5MB`); continue; }
        const fd = new FormData();
        fd.set("file", file); fd.set("kind", "business-ad-gallery");
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await r.json();
        if (j.success) newUrls.push(j.data.url);
        else toast.error(j.error ?? "上傳失敗");
      }
      if (newUrls.length > 0) {
        onChange([...value, ...newUrls]);
        toast.success(`已上傳 ${newUrls.length} 張`);
      }
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {value.map((url, i) => (
          <div key={url + i} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`第 ${i + 1} 張`} className="h-full w-full object-cover" />
            <span className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[10px] font-bold text-white">
              {i + 1}
            </span>
            <button type="button" onClick={() => remove(i)}
              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100">
              <X className="h-3 w-3" />
            </button>
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition group-hover:opacity-100">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0}
                className="rounded bg-black/70 p-1 text-white disabled:opacity-30">←</button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1}
                className="rounded bg-black/70 p-1 text-white disabled:opacity-30">→</button>
            </div>
          </div>
        ))}

        {value.length < MAX_IMAGES && (
          <button type="button" onClick={() => ref.current?.click()}
            className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 hover:border-primary">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        最多 {MAX_IMAGES} 張、每張 {MAX_SIZE / 1024 / 1024}MB；可拖移排序，第 1 張會作為輔助縮圖
      </p>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
    </div>
  );
}
