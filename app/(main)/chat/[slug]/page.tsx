import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ChatRoomClient } from "@/components/chat/chat-room-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const room = await db.chatRoom.findUnique({ where: { slug: params.slug } });
  return { title: room ? `# ${room.name} | 即時聊天室` : "聊天室" };
}

export default async function ChatRoomPage({
  params,
}: {
  params: { slug: string };
}) {
  const room = await db.chatRoom.findUnique({ where: { slug: params.slug } });
  if (!room || !room.isActive) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <ChatRoomClient roomSlug={room.slug} roomName={room.name} rating={room.rating} />
    </div>
  );
}
