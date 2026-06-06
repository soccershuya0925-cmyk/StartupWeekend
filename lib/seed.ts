// ============================================================
// デモ用シードデータ（発表・動作確認で「映える」状態を即再現）
// 期限は実行日基準で相対計算するので、いつ実行しても自然なデモになる。
// ============================================================

import type { FoodItem, CookingLog, LossEvent } from "@/types";
import {
  saveFridge,
  saveLogs,
  saveProgress,
  addLossEvent,
  setZeroLossWeeks,
  getLossEvents,
  setShareCount,
  genId,
  resetAll,
} from "@/lib/storage";
import { applyXP, XP_REWARDS } from "@/lib/xp";
import { computeLossStats } from "@/lib/loss";

/** n 日後の YYYY-MM-DD を返す */
function dateAfter(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** n 日前の ISO 文字列を返す */
function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/** デモ用の冷蔵庫サンプル（緊急〜安全がバランス良く混ざるように・価格付き） */
function demoFridge(): FoodItem[] {
  const now = new Date().toISOString();
  const base: Omit<FoodItem, "id" | "addedAt">[] = [
    { name: "キャベツ", quantity: 1, unit: "個", expiryDate: dateAfter(1), category: "vegetable", price: 158 },
    { name: "トマト", quantity: 3, unit: "個", expiryDate: dateAfter(2), category: "vegetable", price: 198 },
    { name: "ナス", quantity: 2, unit: "本", expiryDate: dateAfter(4), category: "vegetable", price: 138 },
    { name: "豚こま肉", quantity: 1, unit: "パック", expiryDate: dateAfter(0), category: "meat", price: 298 },
    { name: "卵", quantity: 1, unit: "パック", expiryDate: dateAfter(8), category: "dairy", price: 218 },
    { name: "玉ねぎ", quantity: 3, unit: "個", expiryDate: dateAfter(12), category: "vegetable", price: 98 },
  ];
  return base.map((b) => ({ ...b, id: genId(), addedAt: now }));
}

/** デモ用の料理記録サンプル */
function demoLogs(): CookingLog[] {
  const mk = (dishName: string, daysAgo: number): CookingLog => ({
    id: genId(),
    dishName,
    photoUrl: "",
    xpEarned: XP_REWARDS.cookPhoto,
    cookedAt: isoDaysAgo(daysAgo),
  });
  // 新しい順に並ぶよう、古い→新しいで作って返す
  return [mk("肉じゃが", 4), mk("野菜炒め", 2), mk("ラタトゥイユ", 1)];
}

/** デモ用のロス削減イベント（救った中心＋少しだけ処分でロス率が出る） */
function demoLossEvents(): LossEvent[] {
  const saved = (itemName: string, yen: number, daysAgo: number): LossEvent => ({
    id: genId(),
    type: "saved",
    itemName,
    estimatedYen: yen,
    at: isoDaysAgo(daysAgo),
  });
  const wasted = (itemName: string, yen: number, daysAgo: number): LossEvent => ({
    id: genId(),
    type: "wasted",
    itemName,
    estimatedYen: yen,
    at: isoDaysAgo(daysAgo),
  });
  return [
    wasted("レタス", 158, 9), // 9日前に1回だけ処分 → 以降ロスゼロ継続中
    saved("キャベツ", 158, 7),
    saved("豚こま肉", 298, 6),
    saved("トマト", 198, 4),
    saved("玉ねぎ", 98, 3),
    saved("ナス", 138, 3),
    saved("卵", 218, 1),
    saved("きゅうり", 88, 0),
  ];
}

/**
 * デモデータを投入する。
 * 料理16回相当の XP（= スタンプ3個）を積んで、特典交換まで試せる状態にする。
 */
export function seedDemo(): void {
  resetAll();
  saveFridge(demoFridge());
  saveLogs(demoLogs());

  // ロス削減イベント（古い→新しい順で投入）
  for (const ev of demoLossEvents()) addLossEvent(ev);
  // すでに達成済みの「ロスゼロ週間」は付与済みとしてマーク（再付与を防ぐ）
  setZeroLossWeeks(computeLossStats(getLossEvents()).zeroLossWeeks);

  // 料理16回ぶんの XP（= スタンプ3個）でキャラを育てておく
  let progress = applyXP({ level: 1, totalXP: 0, stamps: 0, cookingCount: 0 }, 0);
  for (let i = 0; i < 16; i++) {
    progress = applyXP(progress, XP_REWARDS.cookPhoto, true);
  }
  saveProgress(progress);

  // SNSシェア3回済み → 影響力スコアが「料理クリエイター」圏内になるようデモ映えさせる
  setShareCount(3);
}

/** デモデータ（と全データ）をクリアする */
export function clearDemo(): void {
  resetAll();
}
