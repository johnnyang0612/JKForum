import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn().mockResolvedValue({ id: "log1" });
vi.mock("@/lib/db", () => ({
  db: { adminLog: { create: (args: any) => createMock(args) } },
}));

import { logAdminAction } from "@/lib/admin-log";

describe("admin-log", () => {
  beforeEach(() => createMock.mockClear());

  it("業者 action 寫入 SETTINGS_CHANGE 並前綴 [BUSINESS_*]", async () => {
    await logAdminAction({
      adminId: "admin-001",
      action: "BUSINESS_AD_APPROVE",
      targetType: "BusinessAd",
      targetId: "ad-1",
      detail: "通過",
    });
    expect(createMock).toHaveBeenCalledOnce();
    const args = createMock.mock.calls[0][0];
    expect(args.data.action).toBe("SETTINGS_CHANGE");
    expect(args.data.detail).toMatch(/\[BUSINESS_AD_APPROVE\]/);
  });

  it("既有 enum action 直接寫入", async () => {
    await logAdminAction({
      adminId: "admin-001",
      action: "USER_BAN" as any,
      targetType: "User", targetId: "u1", detail: "違規",
    });
    const args = createMock.mock.calls[0][0];
    expect(args.data.action).toBe("USER_BAN");
    expect(args.data.detail).toBe("違規");
  });

  it("targetType 截斷至 50 字", async () => {
    await logAdminAction({
      adminId: "x", action: "USER_BAN" as any,
      targetType: "x".repeat(100), targetId: "u",
    });
    const args = createMock.mock.calls[0][0];
    expect(args.data.targetType.length).toBe(50);
  });
});
