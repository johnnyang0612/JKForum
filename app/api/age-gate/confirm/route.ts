import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { setAgeGateCookie } from "@/lib/age-gate";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const birthdateStr = body.birthdate as string | undefined;

  if (!birthdateStr) {
    return NextResponse.json(
      { error: "請輸入生日" },
      { status: 400 }
    );
  }

  const birthdate = new Date(birthdateStr);
  if (isNaN(birthdate.getTime())) {
    return NextResponse.json({ error: "生日格式錯誤" }, { status: 400 });
  }

  const now = new Date();
  let age = now.getFullYear() - birthdate.getFullYear();
  const m = now.getMonth() - birthdate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthdate.getDate())) age--;

  if (age < 18) {
    return NextResponse.json(
      { error: "未滿 18 歲不得進入" },
      { status: 403 }
    );
  }

  // Set cookie for 24h
  setAgeGateCookie();

  // If user is logged in, persist birthdate + age confirmed
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        birthdate,
        ageConfirmedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ success: true });
}
