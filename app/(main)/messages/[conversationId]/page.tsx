import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConversationView } from "./conversation-view";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: { conversationId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { title: "私訊" };

  const participant = await db.conversationParticipant.findFirst({
    where: {
      conversationId: params.conversationId,
      userId: { not: session.user.id },
    },
    include: {
      user: { select: { displayName: true } },
    },
  });

  return {
    title: participant ? `與 ${participant.user.displayName} 的對話` : "私訊",
  };
}

export default async function ConversationPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // 確認用戶是參與者
  const myParticipant = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId: params.conversationId,
        userId: session.user.id,
      },
    },
  });

  if (!myParticipant) {
    notFound();
  }

  // 取得對方用戶資訊
  const otherParticipant = await db.conversationParticipant.findFirst({
    where: {
      conversationId: params.conversationId,
      userId: { not: session.user.id },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          status: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  });

  if (!otherParticipant) {
    notFound();
  }

  const otherUser = {
    id: otherParticipant.user.id,
    username: otherParticipant.user.username,
    displayName: otherParticipant.user.displayName,
    avatarUrl: otherParticipant.user.profile?.avatarUrl || null,
    status: otherParticipant.user.status,
  };

  return (
    <ConversationView
      conversationId={params.conversationId}
      otherUser={otherUser}
    />
  );
}
