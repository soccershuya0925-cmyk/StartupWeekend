// ============================================================
// 食品ロス削減の「救った量」カウンター（ピッチの主役）
// ecoActions（期限内に使った／予定どおり食べた）の件数を、
// 救った品数と推定節約額（¥）に換算する。
// ============================================================

import { getEcoActions } from "@/lib/storage";

/** 1品 救うごとの推定節約額（¥）。事業計画の「月数千円の無駄」に対応 */
export const YEN_SAVED_PER_ITEM = 150;

function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export interface SavingsStats {
  rescuedTotal: number; // 累計で救った品数
  rescuedThisMonth: number; // 今月救った品数
  yenTotal: number; // 累計の推定節約額
  yenThisMonth: number; // 今月の推定節約額
}

/** 救った量・節約額を集計する */
export function getSavingsStats(now = new Date()): SavingsStats {
  const actions = getEcoActions();
  const rescuedTotal = actions.length;
  const rescuedThisMonth = actions.filter((iso) =>
    sameMonth(new Date(iso), now)
  ).length;
  return {
    rescuedTotal,
    rescuedThisMonth,
    yenTotal: rescuedTotal * YEN_SAVED_PER_ITEM,
    yenThisMonth: rescuedThisMonth * YEN_SAVED_PER_ITEM,
  };
}
