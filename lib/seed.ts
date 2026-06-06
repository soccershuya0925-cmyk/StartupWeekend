// ============================================================
// デモ用シードデータ（発表・動作確認で「映える」状態を即再現）
// 期限は実行日基準で相対計算するので、いつ実行しても自然なデモになる。
// ============================================================

import type { FoodItem, CookingLog, PlannedMeal } from "@/types";
import {
  saveFridge,
  saveLogs,
  saveProgress,
  savePlans,
  genId,
  resetAll,
} from "@/lib/storage";
import { applyXP, XP_REWARDS } from "@/lib/xp";

/** n 日後の YYYY-MM-DD を返す */
function dateAfter(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** デモ用の冷蔵庫サンプル（緊急〜安全がバランス良く混ざるように） */
function demoFridge(): FoodItem[] {
  const now = new Date().toISOString();
  const base: Omit<FoodItem, "id" | "addedAt">[] = [
    { name: "キャベツ", quantity: 1, unit: "個", expiryDate: dateAfter(1), category: "vegetable" },
    { name: "トマト", quantity: 3, unit: "個", expiryDate: dateAfter(2), category: "vegetable" },
    { name: "ナス", quantity: 2, unit: "本", expiryDate: dateAfter(4), category: "vegetable" },
    { name: "豚こま肉", quantity: 1, unit: "パック", expiryDate: dateAfter(0), category: "meat" },
    { name: "卵", quantity: 1, unit: "パック", expiryDate: dateAfter(8), category: "dairy" },
    { name: "玉ねぎ", quantity: 3, unit: "個", expiryDate: dateAfter(12), category: "vegetable" },
  ];
  return base.map((b) => ({ ...b, id: genId(), addedAt: now }));
}

/** デモ用の「食べる予定」サンプル（折衷C: ¥390注文済み） */
function demoPlans(): PlannedMeal[] {
  const now = new Date().toISOString();
  return [
    {
      id: genId(),
      productName: "冷凍ごろごろ野菜カレー",
      emoji: "🍛",
      eatDate: dateAfter(1),
      done: false,
      orderedAt: now,
    },
    {
      id: genId(),
      productName: "具だくさん野菜スープ",
      emoji: "🥣",
      eatDate: dateAfter(3),
      done: false,
      orderedAt: now,
    },
  ];
}

/** デモ用の料理記録サンプル */
function demoLogs(): CookingLog[] {
  const mk = (dishName: string, daysAgo: number): CookingLog => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return {
      id: genId(),
      dishName,
      photoUrl: "",
      xpEarned: XP_REWARDS.cookPhoto,
      cookedAt: d.toISOString(),
    };
  };
  // 新しい順に並ぶよう、古い→新しいで作って返す
  return [mk("肉じゃが", 4), mk("野菜炒め", 2), mk("ラタトゥイユ", 1)];
}

/**
 * デモデータを投入する。
 * 料理6回相当の XP を積んで、キャラがある程度育った状態にする。
 */
export function seedDemo(): void {
  resetAll();
  saveFridge(demoFridge());

  const logs = demoLogs();
  saveLogs(logs);

  // 折衷C: ¥390 注文済みの「食べる予定」も投入
  savePlans(demoPlans());

  // 料理6回ぶんの XP（= スタンプ1個 + α）でキャラを育てておく
  let progress = applyXP(
    { level: 1, totalXP: 0, stamps: 0, cookingCount: 0 },
    0
  );
  for (let i = 0; i < 6; i++) {
    progress = applyXP(progress, XP_REWARDS.cookPhoto, true);
  }
  saveProgress(progress);
}

/** デモデータ（と全データ）をクリアする */
export function clearDemo(): void {
  resetAll();
}
