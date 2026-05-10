"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AdWrapper } from "@/components/ad/ad-wrapper";
import { VerifyEmailBanner } from "@/components/layout/verify-email-banner";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import type { ReactNode } from "react";

const defaultCategories = [
  {
    name: "綜合討論",
    slug: "general",
    forums: [
      { name: "閒聊", slug: "chat" },
      { name: "新聞", slug: "news" },
      { name: "時事", slug: "current-affairs" },
    ],
  },
  {
    name: "科技",
    slug: "tech",
    forums: [
      { name: "程式設計", slug: "programming" },
      { name: "3C 產品", slug: "gadgets" },
      { name: "遊戲", slug: "gaming" },
    ],
  },
  {
    name: "生活",
    slug: "life",
    forums: [
      { name: "美食", slug: "food" },
      { name: "旅遊", slug: "travel" },
      { name: "健身", slug: "fitness" },
    ],
  },
];

export function MainLayoutClient({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <VerifyEmailBanner />
      <Header onMenuToggle={() => setMobileMenuOpen(true)} />

      <div className="flex flex-1">
        <Sidebar
          categories={defaultCategories}
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle className="text-primary">JKForum</SheetTitle>
            </SheetHeader>
            <div className="mt-4 overflow-y-auto">
              <Sidebar
                categories={defaultCategories}
                className="!flex !static !h-auto !w-full !border-0"
              />
            </div>
          </SheetContent>
        </Sheet>

        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <div className="container-main py-4 sm:py-6">
            <AnnouncementBanner />
            <AdWrapper position="HOME_BANNER" className="mb-4 mt-2" />
            {children}
          </div>
        </main>
      </div>

      <Footer className="hidden lg:block" />
      <MobileNav />
      <AdWrapper position="OVERLAY" />
    </div>
  );
}
