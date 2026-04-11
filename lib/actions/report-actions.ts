"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { reportSchema } from "@/lib/validations/post";

export async function createReport(formData: FormData) {
  const user = await requireAuth();

  const raw = {
    targetType: formData.get("targetType") as string,
    targetId: formData.get("targetId") as string,
    type: formData.get("type") as string,
    reason: formData.get("reason") as string,
    evidence: (formData.get("evidence") as string) || undefined,
  };

  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  // Check for duplicate report
  const existing = await db.report.findFirst({
    where: {
      reporterId: user.id,
      targetType: data.targetType,
      targetId: data.targetId,
      status: { in: ["PENDING", "REVIEWING"] },
    },
  });

  if (existing) {
    return { error: "您已對此內容提交過檢舉，正在處理中" };
  }

  try {
    await db.report.create({
      data: {
        reporterId: user.id,
        targetType: data.targetType,
        targetId: data.targetId,
        type: data.type,
        reason: data.reason,
        evidence: data.evidence,
      },
    });

    return { success: true, message: "檢舉已提交，我們會盡快處理" };
  } catch (error) {
    console.error("Create report error:", error);
    return { error: "檢舉失敗，請稍後再試" };
  }
}
