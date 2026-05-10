"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function ImageLightbox({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!url) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [url, onClose]);

  if (!url) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur safe-area-inset"
    >
      <button
        type="button"
        onClick={onClose}
        className="tap-target absolute right-3 top-3 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)", right: "calc(env(safe-area-inset-right, 0px) + 12px)" }}
        aria-label="關閉"
      >
        <X className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="預覽"
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}
