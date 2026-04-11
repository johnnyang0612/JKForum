"use client";

import { AdWrapper } from "./ad-wrapper";

interface PostInlineAdsProps {
  forumId?: string;
}

/**
 * 文章頁面穿插廣告
 * 在回覆列表後方顯示一個穿插廣告
 */
export function PostInlineAds({ forumId }: PostInlineAdsProps) {
  return (
    <AdWrapper position="POST_INLINE" forumId={forumId} />
  );
}
