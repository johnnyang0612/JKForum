/**
 * HTML 清理工具
 * 客戶端使用 DOMPurify，伺服器端使用簡單的 regex 清理
 */

const ALLOWED_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s", "strike",
  "blockquote", "pre", "code",
  "ul", "ol", "li",
  "a", "img",
  "table", "thead", "tbody", "tr", "th", "td",
  "span", "div",
]);

const ALLOWED_ATTRS = new Set([
  "href", "target", "rel",
  "src", "alt", "width", "height",
  "class",
]);

/**
 * 清理 HTML 內容（客戶端使用 DOMPurify，伺服器端使用 regex）
 */
export async function sanitizeHtml(dirty: string): Promise<string> {
  if (typeof window !== "undefined") {
    // 客戶端使用 DOMPurify
    const DOMPurify = (await import("dompurify")).default;
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: Array.from(ALLOWED_TAGS),
      ALLOWED_ATTR: Array.from(ALLOWED_ATTRS),
      ALLOW_DATA_ATTR: false,
    });
  }

  // 伺服器端：使用簡單的清理邏輯
  return serverSanitize(dirty);
}

/**
 * 伺服器端簡易 HTML 清理
 * 移除危險標籤和屬性，只保留允許的
 */
function serverSanitize(html: string): string {
  // 移除 script 標籤及內容
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 移除 style 標籤及內容
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // 移除事件處理器屬性 (onclick, onerror, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");

  // 移除 javascript: URLs
  clean = clean.replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, "");
  clean = clean.replace(/src\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, "");

  // 移除 data: URLs（除了 data:image）
  clean = clean.replace(/(?:href|src)\s*=\s*(?:"data:(?!image)[^"]*"|'data:(?!image)[^']*')/gi, "");

  // 移除不允許的標籤（但保留內容）
  clean = clean.replace(/<\/?(?!(?:h[1-6]|p|br|hr|strong|b|em|i|u|s|strike|blockquote|pre|code|ul|ol|li|a|img|table|thead|tbody|tr|th|td|span|div)\b)[a-z][a-z0-9]*\b[^>]*>/gi, "");

  return clean;
}

/**
 * 移除所有 HTML 標籤，只保留純文字
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * 從 HTML 內容中提取摘要
 */
export function extractExcerpt(html: string, maxLength: number = 200): string {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}
