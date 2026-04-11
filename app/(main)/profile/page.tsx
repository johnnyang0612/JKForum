import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function ProfileRedirect() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  redirect(`/profile/${session.user.id}`);
}
