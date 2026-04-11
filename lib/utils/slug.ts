/**
 * 將中文/英文文本轉換為 URL 安全的 slug，附加隨機後綴
 */
export function generateSlug(text: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  const slug = text
    .toString()
    .toLowerCase()
    .trim()
    // 將中文字元保留但替換空格與特殊字元
    .replace(/\s+/g, "-")           // 空格轉換為連字號
    .replace(/[^\w\u4e00-\u9fff\u3400-\u4dbf-]/g, "") // 只保留字母、數字、中文、連字號
    .replace(/--+/g, "-")           // 合併多個連字號
    .replace(/^-+/, "")             // 移除開頭連字號
    .replace(/-+$/, "");            // 移除結尾連字號

  // 如果 slug 為空（純特殊字元），使用 "post" 作為前綴
  const baseSlug = slug || "post";

  // 限制長度（保留空間給隨機後綴）
  const trimmedSlug = baseSlug.substring(0, 200);

  return `${trimmedSlug}-${randomSuffix}`;
}
