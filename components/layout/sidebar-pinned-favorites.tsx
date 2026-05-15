"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bookmark, GripVertical, Pin, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type FavItem = {
  id: string;
  title: string;
  city: string;
  district: string;
  coverImageUrl: string | null;
  tier: string;
  isActive: boolean;
};

export function SidebarPinnedFavorites({ collapsed = false }: { collapsed?: boolean }) {
  const { status } = useSession();
  const [favs, setFavs] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    fetch("/api/business/favorites", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setFavs(j.favorites);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [status]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setFavs((prev) => {
      const oldIdx = prev.findIndex((x) => x.id === active.id);
      const newIdx = prev.findIndex((x) => x.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return prev;
      const next = arrayMove(prev, oldIdx, newIdx);
      // 同步到 DB（跨裝置同步）
      fetch("/api/business/favorites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.map((x) => x.id) }),
      }).catch(() => null);
      return next;
    });
  }

  function handleUnpin(adId: string) {
    // optimistic remove
    setFavs((prev) => prev.filter((x) => x.id !== adId));
    fetch(`/api/business/favorites/${adId}`, { method: "DELETE" }).catch(() => null);
  }

  if (status !== "authenticated") return null;

  return (
    <div className={cn("border-t pt-3", collapsed ? "px-2" : "px-3")}>
      {!collapsed && (
        <h3 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Pin className="h-3 w-3" />
          收藏釘板
          {favs.length > 0 && <span className="ml-auto text-[10px] font-normal opacity-60">{favs.length}</span>}
        </h3>
      )}

      {loading ? (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-muted/60" />
          ))}
        </div>
      ) : favs.length === 0 ? (
        !collapsed && (
          <div className="rounded-md border border-dashed bg-muted/30 px-3 py-3 text-center text-[11px] text-muted-foreground">
            <Bookmark className="mx-auto mb-1 h-4 w-4 opacity-40" />
            尚無收藏<br />到店家頁按 ❤ 收藏
          </div>
        )
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={favs.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1">
              {favs.map((f) => (
                <SortableFav key={f.id} fav={f} collapsed={collapsed} onUnpin={handleUnpin} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableFav({
  fav,
  collapsed,
  onUnpin,
}: {
  fav: FavItem;
  collapsed: boolean;
  onUnpin: (adId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: fav.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-1.5 rounded-md border bg-card p-1 hover:border-primary/50",
        isDragging && "z-10 ring-2 ring-primary"
      )}
    >
      {!collapsed && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="拖曳排序"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}
      <Link
        href={`/listing/ad/${fav.id}`}
        className="flex flex-1 items-center gap-2 overflow-hidden"
        title={collapsed ? fav.title : undefined}
      >
        {fav.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fav.coverImageUrl}
            alt={fav.title}
            className="h-7 w-7 shrink-0 rounded object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted text-xs">
            🏪
          </div>
        )}
        {!collapsed && (
          <div className="min-w-0 flex-1 pr-5">
            <p className="line-clamp-1 text-xs font-medium">{fav.title}</p>
            <p className="line-clamp-1 text-[10px] text-muted-foreground">
              {fav.city} {fav.district}
              {!fav.isActive && <span className="ml-1 text-rose-500">已下架</span>}
            </p>
          </div>
        )}
      </Link>
      {!collapsed && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm(`取消收藏「${fav.title}」？`)) onUnpin(fav.id);
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-rose-500 group-hover:opacity-100 focus-visible:opacity-100"
          aria-label="取消收藏"
          title="取消收藏"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}
