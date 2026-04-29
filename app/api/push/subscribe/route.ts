import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      "BOLE0nXrSO3S-MV1elsCqMspoUPpetYH7Nwg-bxiE55RJFVvn8lbIXCmbEMwSW-qb8-Gtsfs-pZZkLnPjCuqyA4",
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => ({}));
  const { endpoint, keys, ua } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ success: false, error: "缺少 endpoint/keys" }, { status: 400 });
  }
  await db.pushSubscription.upsert({
    where: { endpoint },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      ua: ua ?? null,
      userId: session?.user?.id ?? null,
      lastUsed: new Date(),
    },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      ua: ua ?? null,
      userId: session?.user?.id ?? null,
    },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const endpoint = body.endpoint;
  if (!endpoint) {
    return NextResponse.json({ success: false, error: "缺少 endpoint" }, { status: 400 });
  }
  await db.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ success: true });
}
