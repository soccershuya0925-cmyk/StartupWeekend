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
  price?: number; // 取得価格（円）。節約額の概算に使う。レシート読取時に入る
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
  stamps: number; // これまでに獲得した総スタンプ数（料理5回ごとに+1）
  cookingCount: number; // 料理した回数（5回ごとにスタンプ1枚）
  redeemedStamps?: number; // 特典交換で消費したスタンプ数（利用可能 = stamps - redeemedStamps）
}

/** ロス削減イベント（食材を救った／捨てた の1件） */
export type LossEventType = "saved" | "wasted";
export interface LossEvent {
  id: string;
  type: LossEventType; // saved=期限内に使い切った / wasted=期限切れで処分
  itemName: string;
  estimatedYen: number; // 救った／無駄にした金額の概算
  at: string; // ISO 8601 形式
}

/** 特典（スタンプ交換のカタログ。静的データ） */
export interface Reward {
  id: string;
  name: string;
  cost: number; // 必要スタンプ数
  partner: string; // 提携先
  emoji: string;
}

/** 特典交換の履歴1件 */
export interface Redemption {
  id: string;
  rewardId: string;
  rewardName: string;
  code: string; // 提示用クーポンコード
  cost: number;
  at: string; // ISO 8601 形式
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

/** 補充ショップの商品（折衷案: HTML版の¥390商品をツールに統合） */
export interface ShopProduct {
  id: string;
  name: string;
  price: number; // 円（基本 ¥390）
  emoji: string;
  category: FoodCategory;
  expiryDays: number; // 購入後の標準消費期限（日数）
  tag?: string; // "冷凍" など
}

/** 注文（補充。デモ＝実決済なし） */
export interface OrderLine {
  productId: string;
  name: string;
  price: number;
  qty: number;
}
export interface Order {
  id: string;
  lines: OrderLine[];
  total: number;
  at: string; // ISO 8601 形式
}
