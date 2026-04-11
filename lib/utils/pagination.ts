export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 計算分頁參數
 */
export function calculatePagination(
  page: number = 1,
  limit: number = 20,
  total: number = 0
): PaginationResult {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const currentPage = Math.min(safePage, totalPages);

  return {
    skip: (currentPage - 1) * safeLimit,
    take: safeLimit,
    page: currentPage,
    limit: safeLimit,
    total,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

/**
 * 從 URL search params 解析分頁參數
 */
export function parsePaginationParams(
  searchParams: { page?: string; pageSize?: string; limit?: string },
  defaultLimit: number = 20
): { page: number; limit: number } {
  const page = parseInt(searchParams.page || "1", 10) || 1;
  const limit = parseInt(searchParams.pageSize || searchParams.limit || String(defaultLimit), 10) || defaultLimit;

  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
  };
}
