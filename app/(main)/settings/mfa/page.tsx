import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MfaClient } from "./mfa-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "雙因素認證",
};

export default async function MfaSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true, email: true },
  });

  return (
    <MfaClient
      enabled={user?.twoFactorEnabled ?? false}
      email={user?.email ?? ""}
    />
  );
}
