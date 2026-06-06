// ============================================================
// メシ活アプリ 共通型定義（全画面が依存する契約）
// ここを変更する場合は土台担当に相談すること
// ============================================================

/** 食材カテゴリ */
export type FoodCategory =
  | "vegetable" // 野菜
  | "meat" // 肉・魚
  | "dairy" // 乳製品・卵
  | "seasoning" // 調味料
  | "other"; // その他

/** 食材アイテム（冷蔵庫の在庫1件） */
export interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; // "個", "g", "ml" など
  expiryDate: string; // ISO 8601 形式 (例: "2026-06-10")
  category: FoodCategory;
  addedAt: string; // ISO 8601 形式
}

/** 料理記録（1回の自炊） */
export interface CookingLog {
  id: string;
  dishName: string;
  photoUrl: string; // base64 もしくは blob URL
  xpEarned: number;
  cookedAt: string; // ISO 8601 形式
}

/** ユーザー進捗（キャラクター・スタンプ） */
export interface UserProgress {
  level: number;
  totalXP: number;
  stamps: number;
  cookingCount: number; // 料理した回数（5回ごとにスタンプ1枚）
}

/** キャラクター成長ステージ */
export interface CharacterStage {
  stage: number; // 1〜5
  minLevel: number;
  emoji: string;
  name: string;
}

/** レシートAI解析の結果1件（/api/receipt が返す要素） */
export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  category: FoodCategory;
}

/** 消費期限の緊急度（色分け用） */
export type ExpiryStatus = "urgent" | "warn" | "safe" | "expired";

// ============================================================
// 折衷C：¥390 商品販売 ＋ 食べる予定（食習慣管理）
// ============================================================

/** 販売商品カテゴリ（冷凍中心で日持ち） */
export type ProductCategory = "frozen-meal" | "pasta" | "bread" | "side";

/** ¥390 で届く商品（自社提供・冷凍中心） */
export interface Product {
  id: string;
  name: string;
  price: number; // 基本 ¥390
  emoji: string;
  category: ProductCategory;
  description: string;
  /** この商品が「あと一品」を埋めるシーン・食材タグ */
  tags: string[];
  /** 冷凍での日持ち日数 */
  daysToKeep: number;
}

/** 食べる予定（A の「いつ・どれだけ食べるか」管理） */
export interface PlannedMeal {
  id: string;
  productName: string;
  emoji: string;
  eatDate: string; // ISO 8601 形式 (YYYY-MM-DD)
  done: boolean; // 予定どおり食べたら true
  orderedAt: string; // ISO 8601 形式
}
