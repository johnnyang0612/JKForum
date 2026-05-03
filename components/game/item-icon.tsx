/**
 * 道具/勳章圖示 — iconUrl 優先，fallback 到 emoji
 */
export function ItemIcon({
  iconUrl,
  iconEmoji,
  alt,
  size = 32,
  className = "",
}: {
  iconUrl?: string | null;
  iconEmoji?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}) {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={alt ?? ""}
        width={size}
        height={size}
        className={`inline-block ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  if (iconEmoji) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        style={{ fontSize: size * 0.85, lineHeight: 1, width: size, height: size }}
      >
        {iconEmoji}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ fontSize: size * 0.85, width: size, height: size }}
    >
      📦
    </span>
  );
}
