"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, BookOpen, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ForumStats } from "./forum-stats";
import { ForumFollowButton } from "./forum-follow-button";

interface ForumHeaderProps {
  forum: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    rules: string | null;
    postCount: number;
    todayPostCount: number;
    category: {
      id: string;
      name: string;
      slug: string;
    };
    moderators?: Array<{
      user: {
        id: string;
        username: string;
        displayName: string;
      };
    }>;
  };
  isAuthenticated?: boolean;
  isFollowing?: boolean;
}

export function ForumHeader({ forum, isAuthenticated, isFollowing }: ForumHeaderProps) {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/forums" className="hover:text-foreground transition-colors">
          看板列表
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/forums/${forum.category.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {forum.category.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{forum.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{forum.name}</h1>
          {forum.description && (
            <p className="mt-1 text-muted-foreground">{forum.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {forum.rules && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRules(!showRules)}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              版規
            </Button>
          )}
          <ForumFollowButton
            forumId={forum.id}
            initialFollowing={isFollowing ?? false}
            authenticated={isAuthenticated ?? false}
          />
          {isAuthenticated && (
            <Link href={`/posts/new?forumId=${forum.id}`}>
              <Button size="sm">
                <PenSquare className="h-4 w-4 mr-1" />
                發表新文章
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Rules */}
      {showRules && forum.rules && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-2 font-semibold">版規</h3>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: forum.rules }}
          />
        </div>
      )}

      {/* Stats */}
      <ForumStats
        postCount={forum.postCount}
        todayPostCount={forum.todayPostCount}
        moderators={forum.moderators}
      />
    </div>
  );
}
