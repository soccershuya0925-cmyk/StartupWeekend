// ============================================================
// レベル・XP 計算ロジック
// レベル設計: 100 XP ごとに 1 レベルアップ（Lv = floor(totalXP/100)+1）
// ============================================================

import type { CharacterStage, UserProgress } from "@/types";

/** 1レベルに必要な XP */
export const XP_PER_LEVEL = 100;

/** XP 獲得アクション（事業計画書 §3 機能④に対応） */
export const XP_REWARDS = {
  cookPhoto: 50, // 料理写真を投稿する
  receipt: 10, // レシートを登録する
  useBeforeExpiry: 100, // 消費期限内に食材を使い切る（ボーナス）
  zeroLossWeek: 500, // 食品ロスゼロ週間を達成（特別ボーナス）
  planMeal: 30, // 折衷C: 食べる予定を立てる（¥390注文）
  ateAsPlanned: 80, // 折衷C: 予定どおり食べた（食習慣ボーナス）
} as const;

/** スタンプ：料理 N 回ごとに 1 個 */
export const COOK_PER_STAMP = 5;
/** 特典交換に必要なスタンプ数 */
export const STAMPS_PER_REWARD = 10;

/** キャラクター成長段階（事業計画書 §3 機能④） */
export const STAGES: CharacterStage[] = [
  { stage: 1, minLevel: 1, emoji: "🥚", name: "見習いシェフの卵" },
  { stage: 2, minLevel: 5, emoji: "🍳", name: "料理人見習い" },
  { stage: 3, minLevel: 10, emoji: "👨‍🍳", name: "一人前の料理人" },
  { stage: 4, minLevel: 20, emoji: "🏆", name: "料理マスター" },
  { stage: 5, minLevel: 30, emoji: "⭐", name: "料理の神様" },
];

/** totalXP からレベルを算出 */
export function levelFromXP(totalXP: number): number {
  return Math.floor(Math.max(0, totalXP) / XP_PER_LEVEL) + 1;
}

/** 現在レベル内で獲得済みの XP（0〜XP_PER_LEVEL-1） */
export function xpIntoLevel(totalXP: number): number {
  return Math.max(0, totalXP) % XP_PER_LEVEL;
}

/** 次のレベルまでに必要な残り XP */
export function xpToNextLevel(totalXP: number): number {
  return XP_PER_LEVEL - xpIntoLevel(totalXP);
}

/** XPバー表示用の進捗率（0〜1） */
export function levelProgressRatio(totalXP: number): number {
  return xpIntoLevel(totalXP) / XP_PER_LEVEL;
}

/** レベルから現在のキャラクターステージを返す */
export function stageFromLevel(level: number): CharacterStage {
  let current = STAGES[0];
  for (const s of STAGES) {
    if (level >= s.minLevel) current = s;
  }
  return current;
}

/**
 * XP を加算して新しい進捗を返す（純粋関数）。
 * cookingCount を増やす場合は incrementCooking=true を渡すと
 * スタンプも再計算される。
 */
export function applyXP(
  progress: UserProgress,
  deltaXP: number,
  incrementCooking = false
): UserProgress {
  const totalXP = Math.max(0, progress.totalXP + deltaXP);
  const cookingCount = incrementCooking
    ? progress.cookingCount + 1
    : progress.cookingCount;
  return {
    totalXP,
    level: levelFromXP(totalXP),
    cookingCount,
    stamps: Math.floor(cookingCount / COOK_PER_STAMP),
  };
}
