import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-background to-primary-100 p-4 dark:from-background dark:via-background dark:to-primary-900/20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary">JKForum</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              綜合型社群論壇平台
            </p>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card p-6 shadow-lg sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
