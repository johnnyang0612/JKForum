import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "任務",
  description: "完成每日任務賺金幣、解鎖勳章",
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
