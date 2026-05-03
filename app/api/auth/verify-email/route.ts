import { NextResponse } from "next/server";
import { consumeVerificationToken } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");
  if (!token || !email) {
    return NextResponse.redirect(new URL("/verify-email?error=missing_params", req.url));
  }
  const result = await consumeVerificationToken(email, token);
  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/verify-email?error=${encodeURIComponent(result.error ?? "failed")}`, req.url)
    );
  }
  return NextResponse.redirect(new URL("/verify-email?success=1", req.url));
}
