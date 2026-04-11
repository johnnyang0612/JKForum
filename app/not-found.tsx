import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-foreground">找不到頁面</h2>
      <p className="mt-2 text-muted-foreground">
        你所尋找的頁面不存在或已被移除
      </p>
      <Link href="/" className="mt-8">
        <Button>
          <Home className="mr-2 h-4 w-4" />
          返回首頁
        </Button>
      </Link>
    </div>
  );
}
