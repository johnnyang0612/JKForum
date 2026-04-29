"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type MedalOpt = { slug: string; name: string; iconEmoji: string };

export function MedalAwardForm({ medals }: { medals: MedalOpt[] }) {
  const router = useRouter();
  const [userQuery, setUserQuery] = useState("");
  const [medalSlug, setMedalSlug] = useState(medals[0]?.slug ?? "");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userQuery.trim() || !medalSlug) return;
    startTransition(async () => {
      // 解析 userQuery — 可能是 username 或 user id
      // 先試 ID（cuid-ish），再試 username
      const userIdFetch = await fetch(`/api/users/lookup?q=${encodeURIComponent(userQuery)}`);
      const lookup = await userIdFetch.json().catch(() => ({}));
      const userId = lookup?.user?.id ?? userQuery.trim();

      const res = await fetch("/api/admin/medals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, medalSlug, note: note || null }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`頒發成功：${json.medal.name}`);
        setUserQuery("");
        setNote("");
        router.refresh();
      } else {
        toast.error(json.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-4">
      <input
        type="text"
        value={userQuery}
        onChange={(e) => setUserQuery(e.target.value)}
        placeholder="用戶 username 或 ID"
        required
        className="rounded border bg-background px-3 py-2 text-sm sm:col-span-2"
      />
      <select
        value={medalSlug}
        onChange={(e) => setMedalSlug(e.target.value)}
        className="rounded border bg-background px-3 py-2 text-sm"
      >
        {medals.map((m) => (
          <option key={m.slug} value={m.slug}>
            {m.iconEmoji} {m.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {pending ? "頒發中..." : "頒發"}
      </button>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="備註（選填）"
        className="rounded border bg-background px-3 py-2 text-sm sm:col-span-4"
      />
    </form>
  );
}
