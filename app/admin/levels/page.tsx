import { LEVELS } from "@/lib/constants/levels";
import { formatNumber } from "@/lib/utils/format";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "等級設定" };

export default function AdminLevelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">等級設定</h1>
        <p className="mt-1 text-muted-foreground">
          系統等級配置（共 {LEVELS.length} 個等級，目前為唯讀）
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">等級</th>
              <th className="p-3 text-left font-medium">名稱</th>
              <th className="p-3 text-left font-medium">所需積分</th>
              <th className="p-3 text-left font-medium">顏色</th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((level) => (
              <tr key={level.index} className="border-b hover:bg-muted/30">
                <td className="p-3 font-mono">{level.index}</td>
                <td className="p-3">
                  <span
                    className="font-bold"
                    style={{ color: level.color }}
                  >
                    {level.name}
                  </span>
                </td>
                <td className="p-3">{formatNumber(level.requiredPoints)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: level.color }}
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {level.color}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
