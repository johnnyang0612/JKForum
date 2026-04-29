import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInventory, getStorefrontItems, getRecipes, getMedalRecipes } from "@/lib/game-engine";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") ?? "inventory";

  if (tab === "store") {
    const items = await getStorefrontItems();
    return NextResponse.json({ success: true, items });
  }
  if (tab === "recipes") {
    const recipes = await getRecipes();
    return NextResponse.json({ success: true, recipes });
  }
  if (tab === "medal-recipes") {
    const recipes = await getMedalRecipes();
    return NextResponse.json({ success: true, recipes });
  }
  // inventory (需登入)
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const items = await getInventory(session.user.id);
  return NextResponse.json({ success: true, items });
}
