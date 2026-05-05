/**
 * BusinessAdTagDisplay — 業者刊登「配合項目」唯讀顯示
 *
 * 用於：商家詳情頁、卡片詳情等。
 * 規則：純顯示，不帶連結（依使用者明確需求：「不需要超連結，維持原本單純顯示標籤即可」）
 */
import type { ReactNode } from "react";

type Tag = {
  id?: string;
  name: string;
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
    return emptyText ? <div className="text-xs text-muted-foreground">{emptyText}</div> : null;
  }

  const pillCls =
    "select-none rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary";
  const unlimitedCls =
    "select-none rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground font-medium";

  if (!groupByCategory) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <span key={t.id ?? `${t.name}-${i}`} className={t.isUnlimited ? unlimitedCls : pillCls}>
            {t.name}
          </span>
        ))}
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
    <div className="space-y-2">
      {unlimited.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unlimited.map((t, i) => (
            <span key={t.id ?? `u-${i}`} className={unlimitedCls}>
              {t.name}
            </span>
          ))}
        </div>
      )}
      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat}>
          <p className="mb-1 text-[11px] font-medium text-muted-foreground">{cat}</p>
          <div className="flex flex-wrap gap-1.5">
            {list.map((t, i) => (
              <span key={t.id ?? `${cat}-${i}`} className={pillCls}>
                {t.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
