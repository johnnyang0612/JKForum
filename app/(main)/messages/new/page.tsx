import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NewConversation } from "./new-conversation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "發起新對話",
};

export default async function NewMessagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return <NewConversation />;
}
