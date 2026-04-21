import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "積分商城",
  description: "使用金幣或白金幣兌換道具、勳章與功能解鎖",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
