import type { FoodItem, Product } from "@/types";
import { genId } from "@/lib/storage";

export const PRODUCTS: Product[] = [
  {
    id: "p-curry",
    name: "冷凍ごろごろ野菜カレー",
    price: 390,
    emoji: "🍛",
    category: "frozen-meal",
    description: "レンジ5分。野菜が摂れてお腹も満たせる定番。",
    tags: ["主食", "野菜", "がっつり"],
    daysToKeep: 90,
  },
  {
    id: "p-pasta-tomato",
    name: "完熟トマトのパスタソース",
    price: 390,
    emoji: "🍝",
    category: "pasta",
    description: "麺に絡めるだけ。トマト・ナスが無くても旬の味。",
    tags: ["主食", "トマト", "パスタ"],
    daysToKeep: 120,
  },
  {
    id: "p-bento-yakizakana",
    name: "焼き魚の和定食弁当",
    price: 390,
    emoji: "🍱",
    category: "frozen-meal",
    description: "魚・小鉢・ごはん入り。栄養バランス重視の日に。",
    tags: ["主食", "魚", "バランス"],
    daysToKeep: 60,
  },
  {
    id: "p-soup-veg",
    name: "具だくさん野菜スープ",
    price: 390,
    emoji: "🥣",
    category: "side",
    description: "あと一品・野菜不足の救世主。冷凍で日持ち。",
    tags: ["副菜", "野菜", "あと一品"],
    daysToKeep: 90,
  },
  {
    id: "p-bread-set",
    name: "冷凍カンパーニュ2個",
    price: 390,
    emoji: "🥖",
    category: "bread",
    description: "朝が苦手でも。トースターで香ばしく。",
    tags: ["朝食", "パン"],
    daysToKeep: 100,
  },
  {
    id: "p-gyoza",
    name: "野菜たっぷり冷凍餃子12個",
    price: 390,
    emoji: "🥟",
    category: "frozen-meal",
    description: "焼くだけ。キャベツ・ニラを使い切れない日に。",
    tags: ["主食", "野菜", "がっつり"],
    daysToKeep: 120,
  },
];

export interface ProductSuggestion extends Product {
  reason: string;
}

export function recommendProducts(fridge: FoodItem[], limit = 2): ProductSuggestion[] {
  const lowStock = fridge.length <= 2;
  const hasVegetable = fridge.some((f) => f.category === "vegetable");

  const scored = PRODUCTS.map((p) => {
    let score = 1;
    let reason = "今日のあと一品に";
    if (lowStock && (p.category === "frozen-meal" || p.category === "pasta")) {
      score += 3;
      reason = "冷蔵庫がさみしい日に、これ1つで一食";
    }
    if (!hasVegetable && p.tags.includes("野菜")) {
      score += 2;
      reason = "野菜が不足しがち。これで手軽に野菜をプラス";
    }
    if (p.tags.includes("あと一品")) score += 1;
    return { ...p, reason, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _s, ...rest }) => rest);
}

/** 購入済み商品を冷蔵庫アイテムに変換 */
export function productToFoodItem(p: Product, now = new Date()): import("@/types").FoodItem {
  const d = new Date(now);
  d.setDate(d.getDate() + p.daysToKeep);
  const expiryDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    id: genId(),
    name: p.name,
    quantity: 1,
    unit: "個",
    expiryDate,
    category: "other",
    addedAt: now.toISOString(),
    price: p.price,
  };
}
