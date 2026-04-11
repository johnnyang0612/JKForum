/**
 * 統一 API 回應格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

/**
 * 分頁 Meta
 */
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Cursor 分頁 Meta
 */
export interface CursorPaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * 建立成功回應
 */
export function successResponse<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
}

/**
 * 建立錯誤回應
 */
export function errorResponse(error: string, status: number = 400): ApiResponse {
  return {
    success: false,
    error,
  };
}

/**
 * 建立分頁 Meta
 */
export function createPaginationMeta(
  total: number,
  page: number,
  pageSize: number
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  return {
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * API 列表回應
 */
export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

/**
 * 文章列表 API 查詢參數
 */
export interface PostListQuery {
  page?: number;
  pageSize?: number;
  sort?: "latest" | "popular" | "featured" | "active";
  forumId?: string;
  subforumId?: string;
  authorId?: string;
  status?: string;
  tag?: string;
  search?: string;
}

/**
 * 回覆列表 API 查詢參數
 */
export interface ReplyListQuery {
  page?: number;
  pageSize?: number;
  sort?: "oldest" | "newest" | "popular";
}

/**
 * 搜尋 API 查詢參數
 */
export interface SearchQuery {
  q: string;
  type?: "post" | "user" | "forum";
  page?: number;
  pageSize?: number;
}
