import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NewConversation } from "./new-conversation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "發起新對話",
};

function pickStr(v: string | string[] | undefined) {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const to = pickStr(searchParams.to);
  const adId = pickStr(searchParams.adId);

  let prefilled: { id: string; username: string; displayName: string; profile: { avatarUrl: string | null } | null } | null = null;
  if (to && to !== session.user.id) {
    const u = await db.user.findUnique({
      where: { id: to },
      select: {
        id: true,
        username: true,
        displayName: true,
        profile: { select: { avatarUrl: true } },
      },
    });
    if (u) prefilled = u;
  }

  return <NewConversation prefilledUser={prefilled} adId={adId ?? null} />;
}
