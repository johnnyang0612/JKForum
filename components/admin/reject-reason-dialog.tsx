"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const PRESETS_AD = [
  "圖片不符規範（露點/模糊/盜圖）",
  "文字含違禁/誤導性內容",
  "地區或服務類型錯誤",
  "聯絡資訊不實",
  "重複刊登 / 一稿多投",
];
const PRESETS_KYC = [
  "證件影像模糊不清",
  "證件已過期",
  "資訊與註冊不符",
  "需補上其他輔助文件",
];
const PRESETS_WD = [
  "未完成 KYC 認證",
  "銀行帳號錯誤",
  "可疑提現行為，需補充資料",
];

const PRESET_MAP: Record<string, string[]> = {
  ad: PRESETS_AD,
  kyc: PRESETS_KYC,
  withdraw: PRESETS_WD,
};

export function RejectReasonDialog({
  open, onClose, onSubmit, type,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  type: "ad" | "kyc" | "withdraw";
}) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  const presets = PRESET_MAP[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl">
        <h3 className="text-lg font-bold">退回原因</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          選擇預設原因或自行輸入。系統會通知業者退回理由。
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button key={p} type="button" onClick={() => setReason(p)}
              className="rounded-full border px-2 py-1 text-xs hover:bg-muted">
              {p}
            </button>
          ))}
        </div>

        <textarea
          rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="請描述退回原因..."
          className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" variant="destructive"
            disabled={!reason.trim()}
            onClick={() => { onSubmit(reason.trim()); onClose(); setReason(""); }}>
            送出退回
          </Button>
        </div>
      </div>
    </div>
  );
}
