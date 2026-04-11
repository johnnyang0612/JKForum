"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <AlertTriangle className="h-12 w-12 text-danger" />
      <h2 className="mt-4 text-2xl font-semibold text-foreground">發生錯誤</h2>
      <p className="mt-2 text-muted-foreground">
        很抱歉，系統發生了意外錯誤。請稍後再試。
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-muted-foreground">
          錯誤代碼：{error.digest}
        </p>
      )}
      <Button onClick={reset} className="mt-8">
        <RotateCcw className="mr-2 h-4 w-4" />
        重試
      </Button>
    </div>
  );
}
