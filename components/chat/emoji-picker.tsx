"use client";

import { useState } from "react";
import { Smile } from "lucide-react";

// 精選 ~80 個常用 emoji，避免引入第三方套件
const EMOJI_GROUPS: Array<{ label: string; list: string[] }> = [
  {
    label: "笑臉",
    list: [
      "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎",
      "🤔", "😏", "😴", "🤤", "😭", "😤", "🥺", "😱",
      "🤯", "😳", "🙄", "😬",
    ],
  },
  {
    label: "手勢",
    list: [
      "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👏",
      "🙏", "💪", "🫶", "✋", "🤚", "👋",
    ],
  },
  {
    label: "心情",
    list: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "💔", "❣️", "💯", "🔥", "✨", "🎉", "🎊", "🥳",
    ],
  },
  {
    label: "生活",
    list: [
      "🍔", "🍕", "🍟", "🍣", "🍜", "🍰", "🍺", "☕",
      "🎮", "🎵", "📷", "📱", "💻", "🚗", "✈️", "🌸",
      "⭐", "🌙", "☀️", "🌧️",
    ],
  },
];

export function EmojiPicker({
  onPick,
}: {
  onPick: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border bg-background hover:bg-muted"
        aria-label="表情符號"
      >
        <Smile className="h-5 w-5 text-muted-foreground" />
      </button>

      {open && (
        <>
          {/* 點擊外部關閉 */}
          <button
            type="button"
            aria-label="關閉表情選單"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-12 right-0 z-50 w-72 rounded-lg border bg-popover p-3 shadow-xl">
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {EMOJI_GROUPS.map((g) => (
                <div key={g.label}>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                    {g.label}
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {g.list.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => {
                          onPick(e);
                          setOpen(false);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-muted"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
