// ============================================================
// 今週（直近7日）の食品ロス削減成果を集計する。
// 既存の /stats は「全期間」レポート。こちらは週次にフォーカスし、
// CO2 削減量の概算を加えてシェアにつなげる（機能: 週次の食品ロス成果）。
// ============================================================

import type { LossEvent } from "@/types";

/**
 * 食材1品あたりの CO2 削減量の概算（kg-CO2e）。
 * 食品ロス由来の温室効果ガスは概ね 2.5kg-CO2e/kg、
 * 学生の食材1品 ≒ 約180g とみなし、約 0.45kg/品 とする（あくまで概算）。
 */
export const CO2_PER_ITEM_KG = 0.45;

export interface WeeklySaved {
  /** 今週「救った」品数 */
  savedCount: number;
  /** 今週 節約できた金額の概算（円） */
  savedYen: number;
  /** 今週 削減できた CO2 の概算（kg、小数第1位） */
  savedCo2Kg: number;
  /** 今週「処分した」品数 */
  wastedCount: number;
  /** 集計対象の日数（7） */
  days: number;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 直近7日間（今日を含む）の「救った」成果を集計する */
export function computeWeeklySaved(events: LossEvent[], now = new Date()): WeeklySaved {
  const today = startOfDay(now);
  const from = new Date(today);
  from.setDate(today.getDate() - 6); // 今日を含む7日間

  const inWeek = (iso: string): boolean => {
    const t = startOfDay(new Date(iso)).getTime();
    return t >= from.getTime() && t <= today.getTime();
  };

  const week = events.filter((e) => inWeek(e.at));
  const saved = week.filter((e) => e.type === "saved");
  const wasted = week.filter((e) => e.type === "wasted");
  const savedYen = saved.reduce((s, e) => s + e.estimatedYen, 0);
  const savedCo2Kg = Math.round(saved.length * CO2_PER_ITEM_KG * 10) / 10;

  return {
    savedCount: saved.length,
    savedYen,
    savedCo2Kg,
    wastedCount: wasted.length,
    days: 7,
  };
}

/** 直近7日間に「救った」イベントだけを新しい順で返す */
export function recentSaved(events: LossEvent[], now = new Date(), limit = 8): LossEvent[] {
  const today = startOfDay(now);
  const from = new Date(today);
  from.setDate(today.getDate() - 6);
  return events
    .filter((e) => e.type === "saved" && startOfDay(new Date(e.at)).getTime() >= from.getTime())
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}
