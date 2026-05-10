"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { resolveReport, dismissReport, banReportTarget } from "@/lib/actions/admin-actions";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminReportDetailPage({ params }: { params: { reportId: string } }) {
  const router = useRouter();
  const { data, isLoading } = useSWR(`/api/admin/reports?reportId=${params.reportId}`, fetcher);
  const [isPending, startTransition] = useTransition();
  const [resolution, setResolution] = useState("");
  const [removeContent, setRemoveContent] = useState(false);
  const [muteTarget, setMuteTarget] = useState(false);
  const [banTarget, setBanTarget] = useState(false);
  const [deductPoints, setDeductPoints] = useState("");
  const [message, setMessage] = useState("");

  const report = data?.data;

  function handleResolve() {
    if (!resolution.trim()) {
      setMessage("請輸入處理結果");
      return;
    }
    const dp = Number(deductPoints) || 0;
    startTransition(async () => {
      const result = await resolveReport(params.reportId, resolution, {
        removeContent,
        muteTarget,
        banTarget,
        deductPoints: dp > 0 ? dp : undefined,
      });
      if (result?.success) {
        router.push("/admin/reports");
      } else {
        setMessage(result?.error || "操作失敗");
      }
    });
  }

  function handleDismiss() {
    startTransition(async () => {
      const result = await dismissReport(params.reportId);
      if (result?.success) {
        router.push("/admin/reports");
      } else {
        setMessage(result?.error || "操作失敗");
      }
    });
  }

  function handleBanUser() {
    const reason = prompt("封鎖原因：");
    if (reason === null) return;
    startTransition(async () => {
      // 修正版：依檢舉的 targetType 找出正確的被檢舉者（之前是誤封檢舉者，致命 bug）
      const result = await banReportTarget(params.reportId, reason || "違反社群規範");
      if (result?.success) {
        setMessage(`已封鎖被檢舉者 (${result.bannedUserId})`);
      } else {
        setMessage(result?.error || "操作失敗");
      }
    });
  }

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded bg-muted" />)}
    </div>;
  }

  if (!report) {
    return <p className="text-muted-foreground">檢舉不存在</p>;
  }

  const TYPE_LABELS: Record<string, string> = {
    PORNOGRAPHY: "色情內容",
    VIOLENCE: "暴力內容",
    SPAM: "垃圾訊息",
    HARASSMENT: "騷擾行為",
    MISINFORMATION: "不實資訊",
    OTHER: "其他",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">檢舉詳情</h1>

      {message && (
        <div className="rounded-lg border bg-muted p-3 text-sm">{message}</div>
      )}

      {/* Report info */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <span className="text-muted-foreground">目標類型：</span>
            <strong> {report.targetType}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">目標 ID：</span>
            <strong className="text-xs"> {report.targetId}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">檢舉分類：</span>
            <Badge variant="secondary">{TYPE_LABELS[report.type] || report.type}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">狀態：</span>
            <Badge>{report.status}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">檢舉者：</span>
            <strong> {report.reporter?.displayName}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">時間：</span>
            <span> {new Date(report.createdAt).toLocaleString("zh-TW")}</span>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">檢舉理由：</p>
          <p className="text-sm bg-muted rounded-lg p-3">{report.reason}</p>
        </div>

        {report.evidence && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">附加證據：</p>
            <p className="text-sm bg-muted rounded-lg p-3">{report.evidence}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {report.status === "PENDING" || report.status === "REVIEWING" ? (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="font-semibold">處理檢舉</h3>

          <Textarea
            label="處理結果說明"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="說明處理方式與結果..."
          />

          <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
            <p className="text-xs text-muted-foreground">同時對被檢舉者執行：</p>
            {(report.targetType === "POST" || report.targetType === "REPLY") && (
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={removeContent} onChange={(e) => setRemoveContent(e.target.checked)} />
                <span>刪除被檢舉內容</span>
              </label>
            )}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={muteTarget} onChange={(e) => setMuteTarget(e.target.checked)} disabled={banTarget} />
              <span>禁言（MUTED）</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={banTarget} onChange={(e) => { setBanTarget(e.target.checked); if (e.target.checked) setMuteTarget(false); }} />
              <span>封鎖（BANNED）</span>
            </label>
            <label className="flex items-center gap-2">
              <span>扣除名聲：</span>
              <input type="number" min="0" max="9999" value={deductPoints} onChange={(e) => setDeductPoints(e.target.value)}
                className="w-20 rounded border bg-background px-2 py-0.5" placeholder="0" />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleResolve} loading={isPending}>
              確認處理（含懲罰）
            </Button>
            <Button variant="outline" onClick={handleDismiss} loading={isPending}>
              駁回檢舉
            </Button>
            <Button variant="destructive" onClick={handleBanUser} loading={isPending}>
              快速封鎖被檢舉者
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">此檢舉已處理完成。</p>
          {report.resolution && (
            <p className="mt-2 text-sm">處理結果：{report.resolution}</p>
          )}
        </div>
      )}
    </div>
  );
}
