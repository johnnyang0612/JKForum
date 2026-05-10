import { Wrench } from "lucide-react";

export function MaintenanceScreen({ message, siteName }: { message: string; siteName: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md space-y-4 text-center">
        <Wrench className="mx-auto h-16 w-16 text-warning" />
        <h1 className="text-3xl font-bold">{siteName} 系統維護中</h1>
        <p className="whitespace-pre-wrap text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">
          稍後請再次嘗試。如有緊急事項請聯絡管理員。
        </p>
      </div>
    </div>
  );
}
