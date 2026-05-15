import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// 公開聊天室已併入「私訊」— 訪問此 URL 直接導向私訊收件匣
export default function ChatPageRedirect() {
  redirect("/messages");
}
