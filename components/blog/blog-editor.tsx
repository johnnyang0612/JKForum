/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Heading2, List, ListOrdered, Link as LinkIcon,
  ImageIcon, Quote, Undo, Redo, Video, Loader2, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export type BlogEditorValue = {
  title: string;
  content: string;
  coverUrl: string;
  isPublic: boolean;
  hasVideo: boolean;
};

export function BlogEditor({
  initial, onChange, busy,
}: {
  initial?: Partial<BlogEditorValue>;
  onChange: (v: BlogEditorValue) => void;
  busy?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? true);
  const coverRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: "撰寫日誌內文，可插入多張圖片或影片..." }),
    ],
    content: initial?.content ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[300px] focus:outline-none px-3 py-2",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const hasVideo = /<video|youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm/i.test(html);
      onChange({ title, content: html, coverUrl, isPublic, hasVideo });
    },
  });

  function emit(next: Partial<BlogEditorValue>) {
    const html = editor?.getHTML() ?? "";
    const hasVideo = /<video|youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm/i.test(html);
    onChange({
      title: next.title ?? title,
      content: html,
      coverUrl: next.coverUrl ?? coverUrl,
      isPublic: next.isPublic ?? isPublic,
      hasVideo,
    });
  }

  async function uploadImage(file: File) {
    if (file.size > 8 * 1024 * 1024) { toast.error("圖片需 < 8MB"); return null; }
    setUploading("image");
    try {
      const fd = new FormData();
      fd.set("file", file); fd.set("kind", "blog");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (j.success) return j.data.url as string;
      toast.error(j.error); return null;
    } finally { setUploading(null); }
  }

  async function uploadVideo(file: File) {
    if (file.size > 50 * 1024 * 1024) { toast.error("影片需 < 50MB"); return null; }
    setUploading("video");
    try {
      const fd = new FormData();
      fd.set("file", file); fd.set("kind", "blog-video");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (j.success) return j.data.url as string;
      toast.error(j.error); return null;
    } finally { setUploading(null); }
  }

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await uploadImage(file);
    if (url) { setCoverUrl(url); emit({ coverUrl: url }); }
    if (coverRef.current) coverRef.current.value = "";
  }
  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !editor) return;
    const url = await uploadImage(file);
    if (url) editor.chain().focus().setImage({ src: url }).run();
    if (imageRef.current) imageRef.current.value = "";
  }
  async function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !editor) return;
    const url = await uploadVideo(file);
    if (url) {
      editor.chain().focus().insertContent(
        `<video controls src="${url}" style="max-width:100%"></video>`
      ).run();
    }
    if (videoRef.current) videoRef.current.value = "";
  }

  if (!editor) return <div className="rounded-xl border bg-muted p-6 text-center">載入編輯器...</div>;

  return (
    <div className="space-y-4">
      {/* 標題 */}
      <div>
        <label className="mb-1 block text-sm font-medium">標題</label>
        <input value={title}
          onChange={(e) => { setTitle(e.target.value); emit({ title: e.target.value }); }}
          maxLength={200} required
          className="w-full rounded-lg border bg-background px-3 py-2 text-lg font-bold" />
      </div>

      {/* 封面 */}
      <div>
        <label className="mb-1 block text-sm font-medium">封面圖</label>
        <div className="flex gap-3">
          <button type="button" onClick={() => coverRef.current?.click()}
            className="flex aspect-video w-48 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/30 hover:border-primary">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="cover" className="h-full w-full object-cover" />
            ) : uploading === "image" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          <input value={coverUrl} placeholder="或貼 URL"
            onChange={(e) => { setCoverUrl(e.target.value); emit({ coverUrl: e.target.value }); }}
            className="flex-1 self-start rounded-md border bg-background px-2 py-1.5 font-mono text-xs" />
        </div>
        <input ref={coverRef} type="file" accept="image/*" hidden onChange={handleCover} />
      </div>

      {/* Toolbar */}
      <div className="rounded-t-lg border border-b-0 bg-muted/30 p-2 flex flex-wrap gap-1">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><Bold className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><Italic className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}><Heading2 className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}><List className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}><ListOrdered className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}><Quote className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => {
          const url = window.prompt("輸入網址：");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}><LinkIcon className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => imageRef.current?.click()} title="插入圖片">
          {uploading === "image" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </ToolbarBtn>
        <ToolbarBtn onClick={() => videoRef.current?.click()} title="插入影片">
          {uploading === "video" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
        </ToolbarBtn>
        <span className="mx-2 self-center text-muted-foreground/40">|</span>
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></ToolbarBtn>
      </div>
      <div className={cn("rounded-b-lg border bg-background", busy && "opacity-60")}>
        <EditorContent editor={editor} />
      </div>

      {/* 公開 */}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublic}
          onChange={(e) => { setIsPublic(e.target.checked); emit({ isPublic: e.target.checked }); }} />
        公開（其他人可瀏覽）
      </label>

      <input ref={imageRef} type="file" accept="image/*" hidden onChange={handleImage} />
      <input ref={videoRef} type="file" accept="video/*" hidden onChange={handleVideo} />
    </div>
  );
}

function ToolbarBtn({ children, onClick, active, title }: any) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={cn("rounded p-1.5 hover:bg-muted", active && "bg-primary/20 text-primary")}>
      {children}
    </button>
  );
}
