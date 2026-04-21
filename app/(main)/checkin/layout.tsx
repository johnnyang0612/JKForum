import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "每日簽到",
  description: "每日簽到領金幣 + 連續獎勵",
};

export default function CheckinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
