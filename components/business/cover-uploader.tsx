"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CoverUploader({
  value, onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("檔案需小於 5MB");
      e.target.value = "";
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", "business-ad-cover");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (j.success) {
        onChange(j.data.url);
        toast.success("封面已上傳");
      } else toast.error(j.error ?? "上傳失敗");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative flex aspect-[9/16] w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/30 hover:border-primary"
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="封面" className="h-full w-full object-cover" />
            <span
              role="button" tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
            >
              <X className="h-3 w-3" />
            </span>
          </>
        ) : busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <Upload className="h-5 w-5" />
            上傳封面
          </div>
        )}
      </button>

      <div className="flex-1 space-y-2 text-xs text-muted-foreground">
        <p>📐 建議 540×960 (9:16) JPG/PNG/WebP</p>
        <p>💾 大小限制 5MB</p>
        <input
          type="text"
          placeholder="或直接貼 URL：https://..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border bg-background px-2 py-1 font-mono text-[11px]"
        />
      </div>

      <input ref={ref} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  );
}
