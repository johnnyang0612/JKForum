"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import {
  Bold, Italic, Underline as UnderIcon, Heading1, Heading2,
  List, ListOrdered, Link as LinkIcon, ImageIcon, Quote,
  Undo, Redo, Type, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useEffect } from "react";

const FONT_FAMILIES: Array<{ value: string; label: string }> = [
  { value: "", label: "預設字型" },
  { value: "'PingFang TC', 'Microsoft JhengHei', sans-serif", label: "蘋方/微軟正黑" },
  { value: "Georgia, 'Times New Roman', serif", label: "Serif 襯線" },
  { value: "'Courier New', monospace", label: "等寬 Mono" },
  { value: "'Comic Sans MS', cursive", label: "手寫 Comic" },
];

const COLORS: Array<{ value: string; label: string }> = [
  { value: "", label: "預設色" },
  { value: "#dc2626", label: "紅" },
  { value: "#ea580c", label: "橘" },
  { value: "#d97706", label: "金" },
  { value: "#16a34a", label: "綠" },
  { value: "#0284c7", label: "藍" },
  { value: "#7c3aed", label: "紫" },
  { value: "#db2777", label: "桃" },
];

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  uploadKind?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "開始撰寫內容…",
  minHeight = "min-h-[180px]",
  uploadKind = "ad-content",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily.configure({ types: ["textStyle"] }),
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage.configure({ inline: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-3 py-2.5",
          minHeight,
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // 同步外部 value 變動
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) editor.commands.setContent(value || "", { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <Toolbar editor={editor} uploadKind={uploadKind} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor, uploadKind }: { editor: Editor; uploadKind: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5">
      {/* 字重 / 樣式 */}
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="粗體">
        <Bold className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="斜體">
        <Italic className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="底線">
        <UnderIcon className="h-3.5 w-3.5" />
      </Btn>

      <Sep />

      {/* 大小（用 heading 模擬：H1=大、H2=中、預設=小） */}
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="大字">
        <Heading1 className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="中字">
        <Heading2 className="h-3.5 w-3.5" />
      </Btn>

      <Sep />

      {/* 字型 */}
      <label className="inline-flex items-center gap-1 rounded border bg-card px-1.5 py-0.5 text-xs">
        <Type className="h-3 w-3 opacity-60" />
        <select
          aria-label="字型"
          className="bg-transparent text-xs outline-none"
          onChange={(e) => {
            const v = e.target.value;
            if (v) editor.chain().focus().setFontFamily(v).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </label>

      {/* 顏色 */}
      <label className="inline-flex items-center gap-1 rounded border bg-card px-1.5 py-0.5 text-xs">
        <Palette className="h-3 w-3 opacity-60" />
        <select
          aria-label="文字顏色"
          className="bg-transparent text-xs outline-none"
          onChange={(e) => {
            const v = e.target.value;
            if (v) editor.chain().focus().setColor(v).run();
            else editor.chain().focus().unsetColor().run();
          }}
        >
          {COLORS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </label>

      <Sep />

      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="條列">
        <List className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="編號">
        <ListOrdered className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="引用">
        <Quote className="h-3.5 w-3.5" />
      </Btn>

      <Sep />

      <Btn
        title="連結"
        active={editor.isActive("link")}
        onClick={() => {
          const url = prompt("輸入連結網址（http 開頭）");
          if (url) editor.chain().focus().setLink({ href: url }).run();
          else if (editor.isActive("link")) editor.chain().focus().unsetLink().run();
        }}
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        title="圖片"
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/jpeg,image/png,image/webp,image/gif";
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append("file", file);
            fd.append("kind", uploadKind);
            try {
              const r = await fetch("/api/upload", { method: "POST", body: fd });
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
        }}
      >
        <ImageIcon className="h-3.5 w-3.5" />
      </Btn>

      <Sep />

      <Btn onClick={() => editor.chain().focus().undo().run()} title="復原">
        <Undo className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="重做">
        <Redo className="h-3.5 w-3.5" />
      </Btn>
    </div>
  );
}

function Btn({
  children, onClick, active, title,
}: { children: React.ReactNode; onClick: () => void; active?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded p-1 transition-colors hover:bg-muted",
        active && "bg-primary/10 text-primary"
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="mx-0.5 h-5 w-px bg-border" />;
}
