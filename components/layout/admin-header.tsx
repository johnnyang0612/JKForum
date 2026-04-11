"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ExternalLink, LogOut, Shield } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 flex h-header items-center justify-between border-b bg-card/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <Link
          href="/admin"
          className="text-lg font-bold text-foreground whitespace-nowrap"
        >
          JKForum <span className="text-primary">管理後台</span>
        </Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Link href="/" target="_blank">
          <Button variant="ghost" size="sm">
            <ExternalLink className="mr-1.5 h-4 w-4" />
            回到網站
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full">
            <Avatar
              src={session?.user?.image}
              fallback={session?.user?.name || "Admin"}
              size="sm"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {session?.user?.name || "管理員"}
              </p>
              <p className="text-xs text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              icon={<LogOut className="h-4 w-4" />}
              destructive
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              登出
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export { AdminHeader };
