/**
 * BusinessAdTagDisplay — 業者刊登「配合項目」唯讀顯示
 *
 * 用於：商家詳情頁、卡片詳情等。
 * 點擊 tag 連到 /?tags=slug 套用相同 filter（如有 slug）。
 */
import Link from "next/link";
import type { ReactNode } from "react";

type Tag = {
  id?: string;
  name: string;
  slug?: string;
  category?: string | null;
  isUnlimited?: boolean;
};

export function BusinessAdTagDisplay({
  tags,
  groupByCategory = false,
  emptyText,
}: {
  tags: Tag[];
  groupByCategory?: boolean;
  emptyText?: ReactNode;
}) {
  if (!tags || tags.length === 0) {
    return emptyText ? <div className="text-sm text-foreground/60">{emptyText}</div> : null;
  }

  const pillBase =
    "inline-flex select-none items-center rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-all active:scale-95";
  const pillNormal =
    "border-zinc-300 bg-zinc-100 text-zinc-700 hover:border-primary hover:bg-primary/10 hover:text-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";
  const pillUnlimited =
    "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90";

  const renderTag = (t: Tag, key: string) => {
    const cls = `${pillBase} ${t.isUnlimited ? pillUnlimited : pillNormal}`;
    if (t.slug && !t.isUnlimited) {
      return (
        <Link key={key} href={`/?tags=${encodeURIComponent(t.slug)}`} className={cls} title={`篩選含「${t.name}」的店家`}>
          {t.name}
        </Link>
      );
    }
    return (
      <span key={key} className={cls}>
        {t.name}
      </span>
    );
  };

  if (!groupByCategory) {
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((t, i) => renderTag(t, t.id ?? `${t.name}-${i}`))}
      </div>
    );
  }

  // 分組顯示
  const grouped: Record<string, Tag[]> = {};
  const unlimited: Tag[] = [];
  for (const t of tags) {
    if (t.isUnlimited) {
      unlimited.push(t);
    } else {
      const k = t.category ?? "其他";
      (grouped[k] ||= []).push(t);
    }
  }

  return (
    <div className="space-y-3">
      {unlimited.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {unlimited.map((t, i) => renderTag(t, t.id ?? `u-${i}`))}
        </div>
      )}
      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat}>
          <p className="mb-2 text-sm font-bold text-foreground/80">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {list.map((t, i) => renderTag(t, t.id ?? `${cat}-${i}`))}
          </div>
        </div>
      ))}
    </div>
  );
}
