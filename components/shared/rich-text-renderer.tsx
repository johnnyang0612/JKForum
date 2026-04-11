import DOMPurify from "dompurify";
import { cn } from "@/lib/utils/cn";

export interface RichTextRendererProps {
  content: string;
  className?: string;
}

function RichTextRenderer({ content, className }: RichTextRendererProps) {
  // Sanitize on server side; DOMPurify works in Node.js via jsdom or similar
  // For SSR safety, we render the sanitized HTML
  const cleanHTML =
    typeof window !== "undefined"
      ? DOMPurify.sanitize(content, {
          ALLOWED_TAGS: [
            "h1", "h2", "h3", "h4", "h5", "h6",
            "p", "br", "hr",
            "ul", "ol", "li",
            "strong", "em", "u", "s", "del",
            "blockquote", "pre", "code",
            "a", "img",
            "table", "thead", "tbody", "tr", "th", "td",
            "span", "div",
          ],
          ALLOWED_ATTR: [
            "href", "target", "rel",
            "src", "alt", "width", "height",
            "class", "style",
          ],
          ADD_ATTR: ["target"],
        })
      : content;

  return (
    <div
      className={cn("prose-content", className)}
      dangerouslySetInnerHTML={{ __html: cleanHTML }}
    />
  );
}

export { RichTextRenderer };
