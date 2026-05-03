/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const docs = Array.isArray(body.docs) ? body.docs.slice(0, 10) : [];
  // 簡單驗證每個 doc 結構
  const cleanDocs = docs.filter((d: any) =>
    d && typeof d.url === "string" && typeof d.type === "string"
  ).map((d: any) => ({
    url: String(d.url).slice(0, 500),
    type: String(d.type).slice(0, 30),
    uploadedAt: d.uploadedAt ?? new Date().toISOString(),
  }));

  await db.user.update({
    where: { id: session.user.id },
    data: { merchantVerifiedDocs: cleanDocs },
  });
  return NextResponse.json({ success: true });
}
