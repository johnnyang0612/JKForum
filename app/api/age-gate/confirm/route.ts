import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { setAgeGateCookie } from "@/lib/age-gate";

export async function POST() {
  setAgeGateCookie();

  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    await db.user.update({
      where: { id: session.user.id },
      data: { ageConfirmedAt: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}
