"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Heading1, Heading2, List, ListOrdered,
  Link as LinkIcon, ImageIcon, Code, Quote, Undo, Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { createPost, updatePost } from "@/lib/actions/post-actions";
import { PostAdvancedAttrsForm } from "@/components/post/post-advanced-attrs-form";
import type { Prisma } from "@prisma/client";

interface PostEditorProps {
  forums: Array<{ id: string; name: string; advancedFiltersJson?: Prisma.JsonValue }>;
  initialData?: {
    id: string;
    title: string;
    content: string;
    forumId: string;
    visibility: string;
    tags: string[];
    advancedAttrs?: Record<string, unknown>;
  };
  defaultForumId?: string;
}

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "公開" },
  { value: "REPLY_TO_VIEW", label: "回覆可見" },
  { value: "PAID", label: "付費內容" },
  { value: "VIP_ONLY", label: "VIP 限定" },
  { value: "PRIVATE", label: "私密" },
];

export function PostEditor({ forums, initialData, defaultForumId }: PostEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialData?.title || "");
  const [forumId, setForumId] = useState(initialData?.forumId || defaultForumId || "");
  const [visibility, setVisibility] = useState(initialData?.visibility || "PUBLIC");
  const [paidCoins, setPaidCoins] = useState<string>("50");
  const [minReadPermission, setMinReadPermission] = useState<string>("0");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [advancedAttrs, setAdvancedAttrs] = useState<Record<string, unknown>>(
    initialData?.advancedAttrs || {}
  );
  const [error, setError] = useState("");

  const currentForum = forums.find((f) => f.id === forumId);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage.configure({ inline: true }),
      Placeholder.configure({ placeholder: "開始撰寫文章內容..." }),
    ],
    content: initialData?.content || "",
    editorProps: {
      attributes: {
        class: "prose prose-neutral dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none",
      },
    },
  });

  function addTag() {
    const t = tagInput.trim();
    if (t && tags.length < 5 && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleSubmit(status: "PUBLISHED" | "DRAFT") {
    if (!title.trim()) {
      setError("請輸入標題");
      return;
    }
    if (!forumId) {
      setError("請選擇看板");
      return;
    }
    if (!editor?.getHTML() || editor.getHTML() === "<p></p>") {
      setError("請輸入內容");
      return;
    }

    setError("");
    startTransition(async () => {
      const formData = new FormData();
      if (initialData?.id) formData.set("id", initialData.id);
      formData.set("title", title);
      formData.set("content", editor!.getHTML());
      formData.set("forumId", forumId);
      formData.set("visibility", visibility);
      formData.set("paidCoins", visibility === "PAID" ? paidCoins : "0");
      formData.set("minReadPermission", minReadPermission);
      formData.set("tags", JSON.stringify(tags));
      formData.set("advancedAttrs", JSON.stringify(advancedAttrs));
      formData.set("status", status);

      const result = initialData?.id
        ? await updatePost(formData)
        : await createPost(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // 用 postId 而非 slug — /posts/[postId] route 是 id-based 查詢
        const r = result as { success: true; postId?: string; slug?: string };
        const id = r.postId || initialData?.id;
        router.push(`/posts/${id ?? ""}`);
        router.refresh();
      }
    });
  }

  if (!editor) return null;

  const forumOptions = forums.map((f) => ({ value: f.id, label: f.name }));

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Title */}
      <Input
        placeholder="文章標題"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        className="text-lg font-semibold"
      />

      {/* Forum & Visibility */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="看板"
          options={forumOptions}
          value={forumId}
          onChange={(e) => setForumId(e.target.value)}
          placeholder="選擇看板"
        />
        <Select
          label="可見性"
          options={VISIBILITY_OPTIONS}
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        />
      </div>

      {/* 看板的進階屬性（per-forum） */}
      {currentForum?.advancedFiltersJson && (
        <PostAdvancedAttrsForm
          filterDefsRaw={currentForum.advancedFiltersJson}
          values={advancedAttrs}
          onChange={setAdvancedAttrs}
        />
      )}

      {/* Extra options based on visibility */}
      {visibility === "PAID" && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
          <label className="block text-sm font-medium">
            💰 解鎖金幣（讀者需花費才能看內容）
          </label>
          <Input
            type="number"
            min="1"
            max="10000"
            value={paidCoins}
            onChange={(e) => setPaidCoins(e.target.value)}
            placeholder="50"
          />
          <p className="text-xs text-muted-foreground">
            扣除手續費後 <b>80%</b> 金幣歸作者。建議定價：一般文 10-50 / 精華 50-200 / 獨家 200+
          </p>
        </div>
      )}

      {visibility === "REPLY_TO_VIEW" && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          👻 隱藏文：讀者須先回覆才能看到完整內容
        </div>
      )}

      {visibility === "VIP_ONLY" && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm text-yellow-700 dark:text-yellow-400">
          👑 VIP 專屬：只有 VIP 會員能閱讀
        </div>
      )}

      {/* Min read permission (always available) */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          閱讀權限下限（0=無限制，10=平民、20=鄉紳、50=騎士、100=公爵、150=VIP、200=皇帝）
        </label>
        <Input
          type="number"
          min="0"
          max="200"
          value={minReadPermission}
          onChange={(e) => setMinReadPermission(e.target.value)}
          placeholder="0"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          標籤（最多 5 個）
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-danger"
              >
                x
              </button>
            </span>
          ))}
        </div>
        {tags.length < 5 && (
          <div className="flex gap-2">
            <Input
              placeholder="輸入標籤名稱"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={addTag} type="button">
              新增
            </Button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 bg-muted/50 p-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-6 w-px bg-border" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-6 w-px bg-border" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-6 w-px bg-border" />
        <ToolbarButton
          onClick={() => {
            const url = prompt("輸入連結網址：");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          active={editor.isActive("link")}
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={async () => {
            const choice = window.confirm(
              "按【確定】上傳檔案，按【取消】輸入網址"
            );
            if (choice) {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/jpeg,image/png,image/webp,image/gif";
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("file", file);
                fd.append("kind", "post-content");
                try {
                  const r = await fetch("/api/upload", {
                    method: "POST",
                    body: fd,
                  });
                  const data = await r.json();
                  if (!r.ok || !data.success) {
                    alert(data.error || "上傳失敗");
                    return;
                  }
                  const url = data.data?.url || data.url;
                  if (url) editor.chain().focus().setImage({ src: url }).run();
                } catch (e) {
                  alert("上傳失敗：" + (e as Error).message);
                }
              };
              input.click();
            } else {
              const url = prompt("輸入圖片網址：");
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }
          }}
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-6 w-px bg-border" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="rounded-b-lg border">
        <EditorContent editor={editor} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => handleSubmit("DRAFT")}
          loading={isPending}
        >
          儲存草稿
        </Button>
        <Button onClick={() => handleSubmit("PUBLISHED")} loading={isPending}>
          發表文章
        </Button>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded p-1.5 hover:bg-muted transition-colors",
        active && "bg-muted text-primary"
      )}
    >
      {children}
    </button>
  );
}
