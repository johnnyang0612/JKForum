"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GROUPS, getGroupConfig } from "@/lib/user-groups";
import { toast } from "sonner";
import type { UserGroup } from "@prisma/client";

type RowUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  userGroup: UserGroup;
  readPermission: number;
  role: string;
  profile?: { postCount: number; replyCount: number } | null;
};

export function UserGroupRow({ user }: { user: RowUser }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [group, setGroup] = useState<UserGroup>(user.userGroup);
  const cfg = getGroupConfig(group);

  function save() {
    if (group === user.userGroup) return;
    startTransition(async () => {
      const res = await fetch("/api/admin/user-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, group }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${user.displayName} → ${cfg.label}`);
        router.refresh();
      } else toast.error(json.error);
    });
  }

  return (
    <tr className="border-t">
      <td className="px-3 py-2">
        <div className="font-medium">{user.displayName}</div>
        <div className="text-xs text-muted-foreground">@{user.username} · {user.email}</div>
      </td>
      <td className="px-3 py-2 text-right text-xs text-muted-foreground">
        {user.profile?.postCount ?? 0} / {user.profile?.replyCount ?? 0}
      </td>
      <td className="px-3 py-2 text-center">
        <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-xs">
          {getGroupConfig(user.userGroup).iconEmoji} {getGroupConfig(user.userGroup).label}
          <span className="ml-1 font-mono opacity-70">{user.readPermission}</span>
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-center gap-2">
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as UserGroup)}
            className="rounded border bg-background px-2 py-1 text-xs"
          >
            {GROUPS.map((g) => (
              <option key={g.group} value={g.group}>
                {g.iconEmoji} {g.label}（{g.readPower}）
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={save}
            disabled={pending || group === user.userGroup}
            className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
          >
            {pending ? "..." : "儲存"}
          </button>
        </div>
      </td>
    </tr>
  );
}
