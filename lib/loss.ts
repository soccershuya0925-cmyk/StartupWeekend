// ============================================================
// ロス削減ロジック（救った/捨てた の集計、節約額の概算、特典カタログ）
// 事業計画書 §2 の「食品ロスの罪悪感と金銭ロス」を数字で可視化する。
// ============================================================

import type { FoodItem, LossEvent, Reward } from "@/types";

/** 価格不明の食材の節約額概算（円） */
export const DEFAULT_ITEM_YEN = 150;

/** 食材1件の金額概算（レシート由来なら実価格、無ければ既定値） */
export function estimatedYen(item: Pick<FoodItem, "price">): number {
  return item.price != null && item.price > 0 ? item.price : DEFAULT_ITEM_YEN;
}

/** 日付文字列を「その日の0時」に丸めた Date を返す */
function startOfDay(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export interface DayBucket {
  label: string; // 曜日 or 日付
  saved: number;
  wasted: number;
}

export interface LossStats {
  savedCount: number;
  savedYen: number;
  wastedCount: number;
  wastedYen: number;
  /** ロス率 0〜1（救った+捨てた のうち捨てた割合） */
  lossRate: number;
  /** 直近の「捨てた」からの経過日数（=ロスゼロ継続日数） */
  streakDays: number;
  /** 7日連続ロスゼロを達成した回数 */
  zeroLossWeeks: number;
  /** 直近7日間の日別バケット（古い→新しい） */
  weekly: DayBucket[];
}

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

/** ロスイベント配列から各種統計を計算 */
export function computeLossStats(events: LossEvent[], now = new Date()): LossStats {
  const saved = events.filter((e) => e.type === "saved");
  const wasted = events.filter((e) => e.type === "wasted");

  const savedYen = saved.reduce((s, e) => s + e.estimatedYen, 0);
  const wastedYen = wasted.reduce((s, e) => s + e.estimatedYen, 0);
  const total = saved.length + wasted.length;
  const lossRate = total === 0 ? 0 : wasted.length / total;

  // 継続日数: 直近の wasted からの経過日数。wasted が無ければ最古イベントからの日数。
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let streakDays = 0;
  if (events.length > 0) {
    if (wasted.length > 0) {
      const lastWaste = wasted
        .map((e) => startOfDay(e.at))
        .sort((a, b) => b.getTime() - a.getTime())[0];
      streakDays = Math.max(0, diffDays(today, lastWaste));
    } else {
      const earliest = events
        .map((e) => startOfDay(e.at))
        .sort((a, b) => a.getTime() - b.getTime())[0];
      streakDays = Math.max(0, diffDays(today, earliest)) + 1;
    }
  }

  // 直近7日の日別バケット
  const weekly: DayBucket[] = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - i));
    const saved = events.filter(
      (e) => e.type === "saved" && diffDays(startOfDay(e.at), day) === 0
    ).length;
    const wasted = events.filter(
      (e) => e.type === "wasted" && diffDays(startOfDay(e.at), day) === 0
    ).length;
    return { label: WEEKDAY[day.getDay()], saved, wasted };
  });

  return {
    savedCount: saved.length,
    savedYen,
    wastedCount: wasted.length,
    wastedYen,
    lossRate,
    streakDays,
    zeroLossWeeks: Math.floor(streakDays / 7),
    weekly,
  };
}

/** 今回新たに付与すべき「ロスゼロ週間」数（達成済み - 付与済み） */
export function newZeroLossWeeks(eligible: number, awarded: number): number {
  return Math.max(0, eligible - awarded);
}

/** 特典カタログ（提携先のスタンプ交換。静的データ・MVP） */
export const REWARDS: Reward[] = [
  { id: "drink", name: "ドリンク1杯無料", cost: 2, partner: "学生街カフェ", emoji: "☕" },
  { id: "veggie", name: "野菜100円引き", cost: 3, partner: "最寄りスーパー", emoji: "🥬" },
  { id: "rice", name: "ごはん大盛り無料", cost: 5, partner: "定食屋ますや", emoji: "🍚" },
  { id: "sweets", name: "スイーツセット無料", cost: 8, partner: "提携カフェ", emoji: "🍰" },
];

/** クーポンコードを生成（提携店で提示する想定の擬似コード） */
export function genCouponCode(reward: Reward, seed: number): string {
  const tail = String(seed % 10000).padStart(4, "0");
  return `MESHI-${reward.id.toUpperCase().slice(0, 4)}-${tail}`;
}
