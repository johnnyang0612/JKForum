import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import { MaintenanceScreen } from "@/components/layout/maintenance-screen";
import { MainLayoutClient } from "@/components/layout/main-layout-client";
import type { ReactNode } from "react";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  // 維護模式：非管理員看不到內容，只看到提示頁
  if (settings.maintenanceMode && !isAdmin) {
    return <MaintenanceScreen message={settings.maintenanceMessage} siteName={settings.name} />;
  }

  return <MainLayoutClient>{children}</MainLayoutClient>;
}
