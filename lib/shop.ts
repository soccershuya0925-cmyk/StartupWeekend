// ============================================================
// 補充ショップ（折衷案）: 在庫が薄い／期限が近いときに ¥390 商品を補充提案。
// HTML版の「¥390/食」モデルをツールに統合し、課題→解決→収益を1画面で繋ぐ。
// ※ デモ実装。実際の決済・在庫連携は行わない。
// ============================================================

import type { FoodItem, ShopProduct, OrderLine } from "@/types";
import { genId } from "@/lib/storage";

/** 基本価格（HTML版のコンセプト ¥390/食） */
export const BASE_PRICE = 390;

/** 商品カタログ（静的・MVP） */
export const PRODUCTS: ShopProduct[] = [
  { id: "bento-wa", name: "和風冷凍弁当", price: 390, emoji: "🍱", category: "other", expiryDays: 60, tag: "冷凍" },
  { id: "bento-yo", name: "洋風冷凍弁当", price: 390, emoji: "🍝", category: "other", expiryDays: 60, tag: "冷凍" },
  { id: "pasta-sauce", name: "ミートソース", price: 390, emoji: "🥫", category: "seasoning", expiryDays: 90 },
  { id: "veg-mix", name: "カット野菜ミックス", price: 390, emoji: "🥬", category: "vegetable", expiryDays: 5 },
  { id: "chicken", name: "サラダチキン2個", price: 390, emoji: "🍗", category: "meat", expiryDays: 14 },
  { id: "egg", name: "たまご1パック", price: 290, emoji: "🥚", category: "dairy", expiryDays: 14 },
  { id: "bread", name: "食パン1斤", price: 290, emoji: "🍞", category: "other", expiryDays: 4 },
  { id: "frozen-veg", name: "冷凍ほうれん草", price: 390, emoji: "🥦", category: "vegetable", expiryDays: 90, tag: "冷凍" },
];

/** 購入した商品を冷蔵庫の在庫（FoodItem）に変換 */
export function productToFoodItem(p: ShopProduct, now = new Date()): FoodItem {
  const d = new Date(now);
  d.setDate(d.getDate() + p.expiryDays);
  const expiryDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return {
    id: genId(),
    name: p.name,
    quantity: 1,
    unit: "個",
    expiryDate,
    category: p.category,
    addedAt: now.toISOString(),
    price: p.price,
  };
}

/**
 * 在庫状況に応じた補充おすすめ。
 * 在庫に無いカテゴリを優先し、足りなければ定番（弁当）で埋める。
 */
export function recommendReplenishment(
  fridge: FoodItem[],
  limit = 3
): ShopProduct[] {
  const presentCategories = new Set(fridge.map((f) => f.category));
  const missing = PRODUCTS.filter((p) => !presentCategories.has(p.category));
  const rest = PRODUCTS.filter((p) => presentCategories.has(p.category));
  // 不足カテゴリ → 定番 の順に重複なく詰める
  const ordered = [...missing, ...rest];
  const seen = new Set<string>();
  const out: ShopProduct[] = [];
  for (const p of ordered) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

/** カート（productId→数量）から注文明細を作る */
export function buildOrderLines(
  cart: Record<string, number>
): OrderLine[] {
  return Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([productId, qty]) => {
      const p = PRODUCTS.find((x) => x.id === productId)!;
      return { productId, name: p.name, price: p.price, qty };
    });
}

/** 補充の意義（在庫が少ない/期限近い）を判定して提案を出すべきか */
export function shouldSuggestReplenish(fridge: FoodItem[]): boolean {
  return fridge.length < 5;
}
