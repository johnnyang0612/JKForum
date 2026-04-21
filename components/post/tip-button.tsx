"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Coins, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface Props {
  postId: string;
  isAuthor: boolean;
  authenticated: boolean;
  className?: string;
}

const AMOUNTS = [10, 50, 100, 500, 1000];

export function TipButton({ postId, isAuthor, authenticated, className }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(50);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (isAuthor) return null;

  const handleTip = async () => {
    if (!authenticated) {
      toast.error("請先登入");
      router.push("/login");
      return;
    }
    setSending(true);
    try {
      const r = await fetch(`/api/posts/${postId}/tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, message: message.trim() || null }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "打賞失敗");
      toast.success(
        `已打賞 ${data.amount} 金幣！作者收到 ${data.authorShare} 金幣`
      );
      setOpen(false);
      setMessage("");
      router.refresh();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5",
          className
        )}
      >
        <Gift className="h-4 w-4" />
        打賞作者
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 hover:bg-muted"
              aria-label="關閉"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-2">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">打賞作者</h3>
                <p className="text-xs text-muted-foreground">
                  80% 金幣歸作者，鼓勵優質創作
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  選擇金額
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(a)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg border-2 p-2 text-xs transition-all",
                        amount === a
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-border hover:border-amber-500/50"
                      )}
                    >
                      <Coins
                        className={cn(
                          "h-4 w-4",
                          amount === a ? "text-amber-500" : "text-muted-foreground"
                        )}
                      />
                      <span className="font-bold">{a}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  附一句話（選填）
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="感謝分享好文！"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {message.length} / 200
                </p>
              </div>

              <Button
                onClick={handleTip}
                loading={sending}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                size="lg"
              >
                <Coins className="mr-2 h-4 w-4" />
                送出 {amount} 金幣
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
