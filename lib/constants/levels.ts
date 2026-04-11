export interface LevelDefinition {
  index: number;
  name: string;
  requiredPoints: number;
  color: string;
  badge: string;
}

export const LEVELS: LevelDefinition[] = [
  { index: 0,  name: "皇帝",    requiredPoints: 1_000_000, color: "#FFD700", badge: "/images/level-badges/emperor.png" },
  { index: 1,  name: "王室",    requiredPoints: 500_000,   color: "#FF4500", badge: "/images/level-badges/royal.png" },
  { index: 2,  name: "威爾斯",  requiredPoints: 250_000,   color: "#DC143C", badge: "/images/level-badges/wales.png" },
  { index: 3,  name: "親王",    requiredPoints: 100_000,   color: "#8B008B", badge: "/images/level-badges/prince-royal.png" },
  { index: 4,  name: "王子",    requiredPoints: 50_000,    color: "#9400D3", badge: "/images/level-badges/prince.png" },
  { index: 5,  name: "大公爵",  requiredPoints: 25_000,    color: "#4B0082", badge: "/images/level-badges/archduke.png" },
  { index: 6,  name: "公爵",    requiredPoints: 10_000,    color: "#0000CD", badge: "/images/level-badges/duke.png" },
  { index: 7,  name: "侯爵",    requiredPoints: 5_000,     color: "#4169E1", badge: "/images/level-badges/marquess.png" },
  { index: 8,  name: "伯爵",    requiredPoints: 2_000,     color: "#1E90FF", badge: "/images/level-badges/earl.png" },
  { index: 9,  name: "子爵",    requiredPoints: 1_000,     color: "#00BFFF", badge: "/images/level-badges/viscount.png" },
  { index: 10, name: "男爵",    requiredPoints: 500,       color: "#00CED1", badge: "/images/level-badges/baron.png" },
  { index: 11, name: "騎士",    requiredPoints: 200,       color: "#20B2AA", badge: "/images/level-badges/knight.png" },
  { index: 12, name: "見習騎士", requiredPoints: 50,       color: "#3CB371", badge: "/images/level-badges/squire.png" },
  { index: 13, name: "準男爵",  requiredPoints: 10,        color: "#2E8B57", badge: "/images/level-badges/baronet.png" },
  { index: 14, name: "勳爵士",  requiredPoints: 5,         color: "#808000", badge: "/images/level-badges/lord.png" },
  { index: 15, name: "鄉紳",    requiredPoints: 1,         color: "#696969", badge: "/images/level-badges/gentry.png" },
  { index: 16, name: "平民",    requiredPoints: 0,         color: "#A9A9A9", badge: "/images/level-badges/commoner.png" },
  { index: 17, name: "奴隸",    requiredPoints: -100,      color: "#2F2F2F", badge: "/images/level-badges/slave.png" },
] as const;

/**
 * 根據總積分取得對應等級
 * 從最高等級開始比對，找到第一個符合條件的等級
 */
export function getLevelByPoints(totalPoints: number): LevelDefinition {
  for (const level of LEVELS) {
    if (totalPoints >= level.requiredPoints) {
      return level;
    }
  }
  // 如果積分低於最低門檻，回傳「奴隸」
  return LEVELS[17];
}

/**
 * 根據等級索引取得等級定義
 */
export function getLevelByIndex(index: number): LevelDefinition {
  return LEVELS[index] ?? LEVELS[16]; // 預設平民
}

/**
 * 取得等級名稱
 */
export function getLevelName(index: number): string {
  return getLevelByIndex(index).name;
}

/**
 * 計算到下一個等級所需的積分
 * 回傳 null 表示已是最高等級
 */
export function getPointsToNextLevel(totalPoints: number): { nextLevel: LevelDefinition; pointsNeeded: number } | null {
  const currentLevel = getLevelByPoints(totalPoints);

  if (currentLevel.index === 0) {
    return null; // 已是最高等級
  }

  const nextLevel = LEVELS[currentLevel.index - 1];
  return {
    nextLevel,
    pointsNeeded: nextLevel.requiredPoints - totalPoints,
  };
}

/**
 * 計算等級進度百分比（到下一級）
 */
export function getLevelProgress(totalPoints: number): number {
  const currentLevel = getLevelByPoints(totalPoints);

  if (currentLevel.index === 0) {
    return 100; // 最高等級，滿進度
  }

  const nextLevel = LEVELS[currentLevel.index - 1];
  const currentThreshold = currentLevel.requiredPoints;
  const nextThreshold = nextLevel.requiredPoints;
  const range = nextThreshold - currentThreshold;

  if (range <= 0) return 0;

  const progress = ((totalPoints - currentThreshold) / range) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}
