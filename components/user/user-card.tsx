import Link from "next/link";
import { UserAvatar } from "./user-avatar";
import { UserBadge } from "./user-badge";

interface UserCardProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    level?: number;
    signature?: string | null;
    role?: string;
  };
  className?: string;
}

export function UserCard({ user, className }: UserCardProps) {
  return (
    <div className={className}>
      <Link
        href={`/profile/${user.id}`}
        className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors"
      >
        <UserAvatar
          src={user.avatarUrl}
          fallback={user.displayName}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">
              {user.displayName}
            </span>
            {user.level != null && <UserBadge level={user.level} />}
          </div>
          {user.signature && (
            <p className="text-xs text-muted-foreground truncate">
              {user.signature}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
