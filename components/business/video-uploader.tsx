"use client";

import { useRef, useState } from "react";
import { Video, X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/lib/constants/config";

const MAX = SITE_CONFIG.maxVideosPerAd; // 3
const MAX_DURATION = SITE_CONFIG.maxVideoDurationSec; // 30

export function VideoUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  function pick() {
    if (value.length >= MAX) {
      toast.error(`最多只能上傳 ${MAX} 段影片`);
      return;
    }
    inputRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset
    if (!file) return;

    if (!SITE_CONFIG.allowedVideoTypes.includes(file.type)) {
      toast.error("不支援的格式（限 mp4 / webm / mov）");
      return;
    }
    if (file.size > SITE_CONFIG.maxVideoSize) {
      toast.error(`檔案太大（上限 ${SITE_CONFIG.maxVideoSize / 1024 / 1024}MB）`);
      return;
    }

    // 前端驗 duration
    const duration = await getDuration(file);
    if (duration > MAX_DURATION + 0.5) {
      toast.error(`影片太長（${duration.toFixed(1)}s），每段最多 ${MAX_DURATION} 秒`);
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "ad-video");
      const r = await fetch("/api/upload-video", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok || !data.success) {
        toast.error(data.error || "上傳失敗");
        return;
      }
      const url = data.data?.url;
      if (url) {
        onChange([...value, url]);
        toast.success("影片已上傳");
      }
    } finally {
      setBusy(false);
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={SITE_CONFIG.allowedVideoTypes.join(",")}
        className="hidden"
        onChange={handleFile}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {value.map((url, idx) => (
          <div key={url + idx} className="relative aspect-video overflow-hidden rounded-lg border bg-black">
            <video
              src={url}
              className="h-full w-full object-cover"
              controls
              preload="metadata"
              playsInline
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-rose-600"
              aria-label="刪除"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {idx + 1} / {MAX}
            </span>
          </div>
        ))}

        {value.length < MAX && (
          <button
            type="button"
            onClick={pick}
            disabled={busy}
            className="flex aspect-video flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <Video className="h-4 w-4" />
              </>
            )}
            <span className="text-[10px]">{busy ? "上傳中..." : `加影片（${value.length}/${MAX}）`}</span>
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        最多 {MAX} 段，每段 ≤ {MAX_DURATION} 秒，單檔 ≤ {SITE_CONFIG.maxVideoSize / 1024 / 1024}MB（mp4/webm/mov）
      </p>
    </div>
  );
}

function getDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const d = video.duration;
      URL.revokeObjectURL(video.src);
      resolve(d);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("無法讀取影片時長"));
    };
    video.src = URL.createObjectURL(file);
  });
}
