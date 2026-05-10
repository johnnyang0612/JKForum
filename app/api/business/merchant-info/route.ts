import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const info = {
    businessHours: String(body.businessHours ?? "").slice(0, 300),
    serviceArea: String(body.serviceArea ?? "").slice(0, 200),
    address: String(body.address ?? "").slice(0, 200),
    phone: String(body.phone ?? "").slice(0, 30),
    line: String(body.line ?? "").slice(0, 50),
    paymentMethods: Array.isArray(body.paymentMethods)
      ? body.paymentMethods.filter((x: unknown) => typeof x === "string").slice(0, 20)
      : [],
    website: String(body.website ?? "").slice(0, 300),
    mapUrl: String(body.mapUrl ?? "").slice(0, 500),
  };

  await db.user.update({
    where: { id: session.user.id },
    data: { merchantInfo: info },
  });

  return NextResponse.json({ ok: true });
}
