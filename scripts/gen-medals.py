# 用 Python 批次生勳章 SVG（顏色 by tier，中央放中文字 + emoji）
import os, json

medals = [
    ("checkin_7", "簽到", "bronze", "📅"),
    ("checkin_30", "月", "silver", "🏅"),
    ("checkin_100", "百日", "gold", "🥇"),
    ("reply-master", "回覆", "gold", "💬"),
    ("replier_50", "活躍", "bronze", "💬"),
    ("replier_500", "回覆", "silver", "🗨️"),
    ("poster_10", "初露", "bronze", "✍️"),
    ("poster_100", "分享", "silver", "📝"),
    ("poster_500", "主題", "gold", "🖋️"),
    ("anniversary-4", "4週年", "limited", "🎂"),
    ("anniversary_1y", "週年", "silver", "🎂"),
    ("tech-master", "科技", "gold", "⚙"),
    ("love-advisor", "愛情", "gold", "💕"),
    ("news-critic", "新聞", "silver", "📰"),
    ("helper", "幫手", "bronze", "🙋"),
    ("good-citizen", "市民", "gold", "🛡"),
    ("great-helper", "超級", "gold", "🤝"),
    ("high-helper", "高級", "silver", "🤲"),
    ("tip-medal", "加分", "silver", "👍"),
    ("love-medal", "愛心", "silver", "❤"),
    ("nightlife-pro", "夜店", "silver", "🌃"),
    ("newbie", "新手", "bronze", "🌱"),
    ("tip_receiver", "歡迎", "bronze", "🎁"),
    ("liked_100", "新星", "bronze", "⭐"),
    ("trend-leader", "潮流", "gold", "🔥"),
    ("liked_1000", "人氣", "gold", "🌟"),
    ("featured_author", "精華", "silver", "✨"),
    ("admin", "管理", "diamond", "🛡"),
    ("whirlwind", "旋風", "bronze", "🌪"),
    ("speed-wind", "疾風", "silver", "⚡"),
    ("storm-wind", "狂風", "gold", "🌀"),
    ("thunder-god", "暴風", "platinum", "⛈"),
    ("bronze-box", "銅", "bronze", "🥉"),
    ("silver-box", "銀", "silver", "🥈"),
    ("gold-box", "金", "gold", "🥇"),
    ("achievement-medal-mid", "中階", "silver", "🏆"),
    ("achievement-medal-large", "大型", "platinum", "🏅"),
    ("site-editor", "編輯", "gold", "✏"),
    ("moderator-mark", "版主", "gold", "🛠"),
    ("super-mod", "超版", "platinum", "🔧"),
    ("deputy-admin", "副站", "platinum", "🎯"),
    ("vip", "VIP", "gold", "👑"),
    ("vip-platinum", "白金", "platinum", "💎"),
    ("wealthy_10000", "大亨", "gold", "💰"),
]

TIER_COLORS = {
    "bronze":   ("#a16207", "#fef3c7", "#92400e"),
    "silver":   ("#94a3b8", "#f1f5f9", "#475569"),
    "gold":     ("#fbbf24", "#fef9c3", "#a16207"),
    "platinum": ("#a855f7", "#fae8ff", "#581c87"),
    "diamond":  ("#06b6d4", "#cffafe", "#0e7490"),
    "limited":  ("#dc2626", "#fee2e2", "#7f1d1d"),
}

OUT = "public/icons/medals"
os.makedirs(OUT, exist_ok=True)

for slug, label, tier, emoji in medals:
    main, light, dark = TIER_COLORS.get(tier, TIER_COLORS["bronze"])
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <radialGradient id="g{slug.replace("-", "_").replace(" ", "")}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="{light}"/>
      <stop offset="100%" stop-color="{main}"/>
    </radialGradient>
  </defs>
  <!-- 緞帶 -->
  <path d="M22 4 L42 4 L40 22 L24 22 Z" fill="{dark}" opacity="0.7"/>
  <path d="M22 4 L24 22 L18 28 L20 4 Z" fill="{main}" opacity="0.6"/>
  <path d="M42 4 L40 22 L46 28 L44 4 Z" fill="{main}" opacity="0.6"/>
  <!-- 主獎章 -->
  <circle cx="32" cy="38" r="20" fill="url(#g{slug.replace("-", "_").replace(" ", "")})" stroke="{dark}" stroke-width="2"/>
  <circle cx="32" cy="38" r="16" fill="none" stroke="{light}" stroke-width="0.8" opacity="0.7"/>
  <!-- 中央文字 -->
  <text x="32" y="42" font-size="11" fill="{dark}" text-anchor="middle" font-weight="bold" font-family="serif">{label}</text>
  <!-- 邊角光點 -->
  <circle cx="22" cy="32" r="1.5" fill="{light}" opacity="0.8"/>
  <circle cx="42" cy="32" r="1.5" fill="{light}" opacity="0.8"/>
  <circle cx="32" cy="22" r="1" fill="{light}" opacity="0.8"/>
</svg>
'''
    with open(f"{OUT}/{slug}.svg", "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"OK {slug} ({tier})")

print(f"\nGenerated {len(medals)} medals")
