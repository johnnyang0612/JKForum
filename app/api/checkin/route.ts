import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCheckin = await db.checkin.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  const recentCheckins = await db.checkin.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 30,
  });

  // Calculate current streak
  let currentStreak = 0;
  const sortedCheckins = [...recentCheckins].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (let i = 0; i < sortedCheckins.length; i++) {
    const checkinDate = new Date(sortedCheckins[i].date);
    checkinDate.setHours(0, 0, 0, 0);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (checkinDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else {
      break;
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      todayCheckin: !!todayCheckin,
      currentStreak,
      recentCheckins,
    },
  });
}
