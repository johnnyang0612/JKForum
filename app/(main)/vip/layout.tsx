import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VIP 會員",
  description: "升級 VIP 享受完整體驗 — 專屬標識、雙倍簽到、VIP 限定內容",
};

export default function VipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
