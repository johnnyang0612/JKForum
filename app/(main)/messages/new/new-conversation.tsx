"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, MessageCircle } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  searchUsersForMessage,
  getOrCreateConversation,
  sendMessage,
} from "@/lib/actions/message-actions";
import { cn } from "@/lib/utils/cn";

interface UserResult {
  id: string;
  username: string;
  displayName: string;
  profile: { avatarUrl: string | null } | null;
}

export function NewConversation() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, startTransition] = useTransition();
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      setError(null);

      if (searchTimer) clearTimeout(searchTimer);

      if (value.trim().length < 2) {
        setUsers([]);
        return;
      }

      const timer = setTimeout(async () => {
        setIsSearching(true);
        try {
          const result = await searchUsersForMessage(value.trim());
          if (result.success && result.data) {
            setUsers(result.data);
          }
        } catch {
          setError("搜尋失敗");
        } finally {
          setIsSearching(false);
        }
      }, 300);

      setSearchTimer(timer);
    },
    [searchTimer]
  );

  function handleSelectUser(user: UserResult) {
    setSelectedUser(user);
    setQuery("");
    setUsers([]);
    setError(null);
  }

  function handleSend() {
    if (!selectedUser || !message.trim()) return;

    setError(null);
    startTransition(async () => {
      // 建立或取得對話
      const convResult = await getOrCreateConversation(selectedUser.id);
      if (convResult.error) {
        setError(convResult.error);
        return;
      }

      if (!convResult.conversationId) {
        setError("建立對話失敗");
        return;
      }

      // 發送訊息
      const msgResult = await sendMessage(convResult.conversationId, message.trim());
      if (msgResult.error) {
        setError(msgResult.error);
        return;
      }

      // 跳轉到對話頁面
      router.push(`/messages/${convResult.conversationId}`);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">發起新對話</h1>
      </div>

      {/* User search */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            選擇收件人
          </label>

          {selectedUser ? (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <UserAvatar
                src={selectedUser.profile?.avatarUrl}
                fallback={selectedUser.displayName}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedUser.displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{selectedUser.username}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                變更
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="輸入使用者名稱搜尋..."
                className="h-10 w-full rounded-lg border bg-muted/50 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
          )}

          {/* Search results */}
          {!selectedUser && (
            <div className="mt-2">
              {isSearching && <LoadingSpinner size="sm" className="py-4" />}

              {!isSearching && query.length >= 2 && users.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  找不到符合的用戶
                </p>
              )}

              {!isSearching && users.length > 0 && (
                <div className="space-y-1 rounded-lg border p-1">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted"
                    >
                      <UserAvatar
                        src={user.profile?.avatarUrl}
                        fallback={user.displayName}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message input */}
        {selectedUser && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              訊息內容
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="輸入你的訊息..."
              rows={4}
              className={cn(
                "w-full resize-none rounded-lg border bg-muted/50 px-4 py-2.5 text-sm outline-none",
                "placeholder:text-muted-foreground",
                "focus:bg-background focus:ring-2 focus:ring-ring"
              )}
              maxLength={5000}
              autoFocus
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">
              {message.length} / 5000
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        {/* Submit */}
        {selectedUser && (
          <div className="flex justify-end">
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              loading={isSending}
            >
              <MessageCircle className="h-4 w-4 mr-1.5" />
              發送訊息
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
