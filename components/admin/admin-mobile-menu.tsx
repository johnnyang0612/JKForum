"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

type Group = { key: string; label: string; items: Array<{ href: string; label: string }> };

export function AdminMobileMenu({ groups }: { groups: Group[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // route 變化時自動關閉抽屜
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const currentLabel =
    groups.flatMap((g) => g.items).find((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
      ?.label ?? "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex tap-target items-center justify-center rounded-md hover:bg-muted lg:hidden"
        aria-label="開啟選單"
      >
        <Menu className="h-5 w-5" />
      </button>
      {currentLabel && (
        <span className="hidden md:inline lg:hidden text-sm text-muted-foreground truncate">
          / {currentLabel}
        </span>
      )}

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          {/* drawer */}
          <aside className="absolute left-0 top-0 h-full w-[80vw] max-w-sm overflow-y-auto bg-card shadow-2xl safe-area-pt safe-area-pb">
            <div className="flex items-center justify-between border-b p-3">
              <p className="font-bold text-primary">JKF 後台選單</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="tap-target rounded-md hover:bg-muted flex items-center justify-center"
                aria-label="關閉選單"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-2 space-y-3">
              {groups.map((g) => (
                <div key={g.key}>
                  <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {g.label}
                  </p>
                  <div className="space-y-0.5">
                    {g.items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex tap-target items-center rounded-md px-3 text-sm font-medium transition-colors ${
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="border-t pt-3">
                <Link
                  href="/"
                  className="flex tap-target items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-muted"
                >
                  ← 返回前台
                </Link>
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
