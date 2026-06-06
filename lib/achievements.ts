// ============================================================
// ロスゼロ週間アチーブメント（機能④の特別ボーナス +500XP）
// 定義: 直近7日間で「ロス削減アクション」が3日以上あり、かつ
//       今の冷蔵庫に期限切れ(expired)が0件 → その週はロスゼロ達成。
//       付与は1週（7日ブロック）につき1回まで。
// ============================================================

import type { FoodItem } from "@/types";
import { expiryStatus } from "@/lib/expiry";
import { applyXP, XP_REWARDS } from "@/lib/xp";
import {
  getEcoActions,
  recordEcoAction,
  getZeroLossAwards,
  addZeroLossAward,
  getProgress,
  saveProgress,
} from "@/lib/storage";

/** 達成に必要な「ロス削減アクションがあった日数」 */
export const ZERO_LOSS_TARGET_DAYS = 3;

/** epoch 基準の7日ブロック番号（週キー）。同一週の二重付与を防ぐ */
function weekKey(now: Date): string {
  const days = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  return String(Math.floor(days / 7));
}

/** YYYY-MM-DD（ローカル） */
function dayStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** ロス削減アクション（期限内に使った／予定どおり食べた）を今日付で記録 */
export function logEcoAction(now = new Date()): void {
  recordEcoAction(now.toISOString());
}

export interface ZeroLossStatus {
  ecoDays: number; // 直近7日でアクションがあった日数
  target: number;
  wasted: number; // 冷蔵庫の期限切れ件数
  achieved: boolean;
  alreadyAwarded: boolean; // 今週すでに付与済みか
}

/** 直近7日のロスゼロ進捗を返す（表示用） */
export function getZeroLossStatus(
  fridge: FoodItem[],
  now = new Date()
): ZeroLossStatus {
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const days = new Set(
    getEcoActions()
      .filter((iso) => new Date(iso).getTime() >= weekAgo)
      .map((iso) => dayStr(new Date(iso)))
  );
  const ecoDays = days.size;
  const wasted = fridge.filter((f) => expiryStatus(f.expiryDate, now) === "expired")
    .length;
  const alreadyAwarded = getZeroLossAwards().includes(weekKey(now));
  return {
    ecoDays,
    target: ZERO_LOSS_TARGET_DAYS,
    wasted,
    achieved: ecoDays >= ZERO_LOSS_TARGET_DAYS && wasted === 0,
    alreadyAwarded,
  };
}

/**
 * 条件を満たしていて今週未付与なら +500XP を付与する。
 * 付与したら true を返す（UI で祝福演出を出すため）。
 */
export function tryAwardZeroLossWeek(
  fridge: FoodItem[],
  now = new Date()
): boolean {
  const status = getZeroLossStatus(fridge, now);
  if (!status.achieved || status.alreadyAwarded) return false;
  addZeroLossAward(weekKey(now));
  saveProgress(applyXP(getProgress(), XP_REWARDS.zeroLossWeek));
  return true;
}
