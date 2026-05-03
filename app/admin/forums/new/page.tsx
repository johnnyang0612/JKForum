"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { createForum } from "@/lib/actions/admin-actions";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TEMPLATES = [
  {
    id: "blank", name: "空白", description: { name: "", slug: "", description: "", rules: "", minLevelToPost: 16, minLevelToView: 16 },
  },
  {
    id: "general", name: "一般討論版", description: { name: "綜合討論", slug: "general", description: "歡迎自由討論", rules: "1. 禁灌水\n2. 禁廣告\n3. 互相尊重", minLevelToPost: 0, minLevelToView: 0 },
  },
  {
    id: "r18-massage", name: "R-18 按摩 / 紓壓", description: { name: "按摩 / 指油壓", slug: "massage", description: "提供 18 歲以上會員之合法按摩、指油壓相關討論", rules: "1. 禁性交易內容\n2. 禁未成年內容\n3. 業者可付費刊登廣告", minLevelToPost: 16, minLevelToView: 16 },
  },
  {
    id: "r18-bar", name: "R-18 酒店 / 制服 / 禮服", description: { name: "酒店 / 制服 / 禮服", slug: "bar-uniform", description: "合法酒店、制服店、禮服店資訊分享", rules: "1. 禁性交易內容\n2. 禁未成年內容\n3. 業者可付費刊登廣告", minLevelToPost: 16, minLevelToView: 16 },
  },
];

export default function AdminNewForumPage() {
  const router = useRouter();
  const { data } = useSWR("/api/forums", fetcher);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [tplKey, setTplKey] = useState("blank");
  const tpl = TEMPLATES.find((t) => t.id === tplKey)?.description ?? TEMPLATES[0].description;

  const categories = data?.data?.categories || [];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createForum(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        router.push("/admin/forums");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">新增看板</h1>

      {error && (
        <div className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-3">
        <label className="mb-2 block text-sm font-medium">📋 套用樣板</label>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button key={t.id} type="button" onClick={() => setTplKey(t.id)}
              className={`rounded-full border px-3 py-1 text-xs ${
                tplKey === t.id ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
              }`}>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <form key={tplKey} onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="分類"
          name="categoryId"
          options={categories.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))}
          placeholder="選擇分類"
          required
        />
        <Input label="看板名稱" name="name" required maxLength={100} defaultValue={tpl.name} />
        <Input label="看板代稱 (slug)" name="slug" required maxLength={100} defaultValue={tpl.slug} placeholder="例如：general-discussion" />
        <Textarea label="描述" name="description" maxLength={1000} defaultValue={tpl.description} />
        <Textarea label="版規" name="rules" maxLength={5000} defaultValue={tpl.rules} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="發文最低等級" name="minLevelToPost" type="number" defaultValue={String(tpl.minLevelToPost)} min="0" max="17" />
          <Input label="觀看最低等級" name="minLevelToView" type="number" defaultValue={String(tpl.minLevelToView)} min="0" max="17" />
        </div>
        <Button type="submit" loading={isPending}>建立看板</Button>
      </form>
    </div>
  );
}
