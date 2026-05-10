"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, LockOpen } from "lucide-react";
import { toggleForumVisibility, toggleForumLocked } from "@/lib/actions/admin-actions";

export function ForumRowActions({
  forumId,
  isVisible,
  isLocked,
}: {
  forumId: string;
  isVisible: boolean;
  isLocked: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggleV() {
    start(async () => {
      await toggleForumVisibility(forumId);
      router.refresh();
    });
  }
  function toggleL() {
    start(async () => {
      await toggleForumLocked(forumId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <button
        type="button"
        onClick={toggleV}
        disabled={pending}
        title={isVisible ? "目前顯示中，點擊隱藏" : "目前隱藏中，點擊顯示"}
        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-warning" />}
      </button>
      <button
        type="button"
        onClick={toggleL}
        disabled={pending}
        title={isLocked ? "目前鎖定中，點擊解鎖" : "目前未鎖，點擊鎖定（禁止發文）"}
        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        {isLocked ? <Lock className="h-4 w-4 text-destructive" /> : <LockOpen className="h-4 w-4" />}
      </button>
      <Link
        href={`/admin/forums/${forumId}`}
        className="text-primary hover:underline"
      >
        編輯
      </Link>
    </div>
  );
}
