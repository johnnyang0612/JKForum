import { format, isToday, isYesterday } from "date-fns";
import { zhTW } from "date-fns/locale";

/**
 * 格式化數字 - 1000 → "1K", 1000000 → "1M"
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 10_000) {
    return `${(n / 1_000).toFixed(0)}K`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return n.toString();
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (isToday(d)) {
    return `今天 ${format(d, "HH:mm")}`;
  }

  if (isYesterday(d)) {
    return `昨天 ${format(d, "HH:mm")}`;
  }

  const now = new Date();
  if (d.getFullYear() === now.getFullYear()) {
    return format(d, "M月d日 HH:mm");
  }

  return format(d, "yyyy年M月d日 HH:mm");
}

/**
 * 相對時間 - "3 分鐘前", "2 天前"
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "剛剛";
  }

  if (diffMin < 60) {
    return `${diffMin} 分鐘前`;
  }

  if (diffHour < 24) {
    return `${diffHour} 小時前`;
  }

  if (diffDay < 7) {
    return `${diffDay} 天前`;
  }

  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return `${weeks} 週前`;
  }

  if (diffDay < 365) {
    const months = Math.floor(diffDay / 30);
    return `${months} 個月前`;
  }

  const years = Math.floor(diffDay / 365);
  return `${years} 年前`;
}

/**
 * 格式化日期（使用 date-fns locale）
 */
export function formatDateLocale(date: Date | string, formatStr: string = "PPP"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, formatStr, { locale: zhTW });
}
