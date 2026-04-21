"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, X, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface Props {
  kind?: string;
  onUploaded?: (url: string) => void;
  className?: string;
}

export function ImageUploader({ kind = "misc", onUploaded, className }: Props) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.error || "上傳失敗");
      const uploadedUrl = data.data?.url || data.url;
      setUrl(uploadedUrl);
      onUploaded?.(uploadedUrl);
      toast.success("上傳成功");
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("已複製網址");
  };

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />

      {!url ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
            uploading
              ? "border-muted cursor-not-allowed"
              : "border-muted-foreground/30 hover:border-primary cursor-pointer"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">上傳中…</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                點擊上傳圖片（JPG / PNG / WebP / GIF，上限 5MB）
              </span>
            </>
          )}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="已上傳" className="w-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setUrl(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
              aria-label="移除"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted p-2">
            <Check className="h-4 w-4 shrink-0 text-emerald-500" />
            <code className="flex-1 truncate text-xs">{url}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copyUrl}
              className="shrink-0"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
