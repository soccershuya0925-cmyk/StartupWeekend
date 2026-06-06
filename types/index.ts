// ============================================================
// メシ活アプリ 共通型定義
// ============================================================

export type FoodCategory =
  | "vegetable"
  | "meat"
  | "dairy"
  | "seasoning"
  | "other";

export interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  category: FoodCategory;
  addedAt: string;
  price?: number;
}

/** 料理投稿（SNSの1投稿） */
export interface CookingLog {
  id: string;
  dishName: string;
  photoUrl: string;
  caption: string;        // SNS投稿のキャプション
  xpEarned: number;
  cookedAt: string;
}

export interface UserProgress {
  level: number;
  totalXP: number;
  stamps: number;
  cookingCount: number;
  redeemedStamps?: number;
}

export interface LossEvent {
  id: string;
  type: "saved" | "wasted";
  itemName: string;
  estimatedYen: number;
  at: string;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  partner: string;
  emoji: string;
}

export interface Redemption {
  id: string;
  rewardId: string;
  rewardName: string;
  code: string;
  cost: number;
  at: string;
}

export interface CharacterStage {
  stage: number;
  minLevel: number;
  emoji: string;
  name: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  category: FoodCategory;
}

export type ExpiryStatus = "urgent" | "warn" | "safe" | "expired";

export interface MyRecipe {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
  description?: string;
  createdAt: string;
}

// ============================================================
// SNS フィード
// ============================================================

/** フィードに流れる1投稿（自分 or デモコミュニティ） */
export interface FeedPost {
  id: string;
  authorId: string;       // "me" = 自分, それ以外 = デモユーザーID
  authorName: string;
  authorAvatar: string;   // 絵文字アバター
  dishName: string;
  photoUrl: string;       // base64 or ""（デモは絵文字プレースホルダ）
  photoEmoji: string;     // photoUrl が無いときに表示する絵文字
  caption: string;
  postedAt: string;       // ISO 8601
  baseLikes: number;      // シード時点のいいね数
  baseStars: number;      // シード時点の平均星評価（1.0〜5.0）
  baseComments: PostComment[];
}

/** コメント1件 */
export interface PostComment {
  id: string;
  postId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  at: string;
}
