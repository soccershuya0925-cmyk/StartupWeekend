// ============================================================
// localStorage ラッパー（MVP のデータ永続化レイヤー）
// SSR 中は window が無いので必ずガードする
// ============================================================

import type {
  FoodItem,
  CookingLog,
  UserProgress,
  LossEvent,
  Redemption,
  MyRecipe,
  PostComment,
  PlannedMeal,
} from "@/types";

const KEYS = {
  fridge: "meshikatsu:fridge",
  logs: "meshikatsu:logs",
  progress: "meshikatsu:progress",
  lossEvents: "meshikatsu:lossEvents",
  redemptions: "meshikatsu:redemptions",
  zeroLossWeeks: "meshikatsu:zeroLossWeeks",
  myRecipes: "meshikatsu:myRecipes",
  shareCount: "meshikatsu:shareCount",
  postLikes: "meshikatsu:postLikes",
  postComments: "meshikatsu:postComments",
  postStars: "meshikatsu:postStars",
  profile: "meshikatsu:profile",
  plans: "meshikatsu:plans",               // PlannedMeal[] — 食べる予定
  ecoActions: "meshikatsu:ecoActions",     // string[] — ロス削減アクションの日付ログ
} as const;

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 容量超過などは無視（MVP）
  }
}

// ---- 簡易 ID 生成（crypto.randomUUID が無い環境のフォールバック付き） ----
export function genId(): string {
  if (isBrowser() && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

// ---- 冷蔵庫（FoodItem[]） ----
export function getFridge(): FoodItem[] {
  return read<FoodItem[]>(KEYS.fridge, []);
}
export function saveFridge(items: FoodItem[]): void {
  write(KEYS.fridge, items);
}
export function addFoodItem(item: FoodItem): FoodItem[] {
  const next = [...getFridge(), item];
  saveFridge(next);
  return next;
}
export function removeFoodItem(id: string): FoodItem[] {
  const next = getFridge().filter((f) => f.id !== id);
  saveFridge(next);
  return next;
}

// ---- 料理記録（CookingLog[]） ----
export function getLogs(): CookingLog[] {
  return read<CookingLog[]>(KEYS.logs, []);
}
export function saveLogs(logs: CookingLog[]): void {
  write(KEYS.logs, logs);
}
export function addLog(log: CookingLog): CookingLog[] {
  const next = [log, ...getLogs()];
  saveLogs(next);
  return next;
}

// ---- ユーザー進捗（UserProgress） ----
const DEFAULT_PROGRESS: UserProgress = {
  level: 1,
  totalXP: 0,
  stamps: 0,
  cookingCount: 0,
};

export function getProgress(): UserProgress {
  return { ...DEFAULT_PROGRESS, ...read<Partial<UserProgress>>(KEYS.progress, {}) };
}
export function saveProgress(progress: UserProgress): void {
  write(KEYS.progress, progress);
}

// ---- ロス削減イベント（LossEvent[]） ----
export function getLossEvents(): LossEvent[] {
  return read<LossEvent[]>(KEYS.lossEvents, []);
}
export function addLossEvent(event: LossEvent): LossEvent[] {
  const next = [event, ...getLossEvents()];
  write(KEYS.lossEvents, next);
  return next;
}

// ---- 特典交換の履歴（Redemption[]） ----
export function getRedemptions(): Redemption[] {
  return read<Redemption[]>(KEYS.redemptions, []);
}
export function addRedemption(r: Redemption): Redemption[] {
  const next = [r, ...getRedemptions()];
  write(KEYS.redemptions, next);
  return next;
}

// ---- 自作レシピ（MyRecipe[]） ----
export function getMyRecipes(): MyRecipe[] {
  return read<MyRecipe[]>(KEYS.myRecipes, []);
}
export function addMyRecipe(r: MyRecipe): MyRecipe[] {
  const next = [r, ...getMyRecipes()];
  write(KEYS.myRecipes, next);
  return next;
}
export function removeMyRecipe(id: string): MyRecipe[] {
  const next = getMyRecipes().filter((r) => r.id !== id);
  write(KEYS.myRecipes, next);
  return next;
}

// ---- ロスゼロ週間の付与済みカウンタ ----
export function getZeroLossWeeks(): number {
  return read<number>(KEYS.zeroLossWeeks, 0);
}
export function setZeroLossWeeks(n: number): void {
  write(KEYS.zeroLossWeeks, n);
}

// ---- SNSシェア回数（影響力スコアに使う） ----
export function getShareCount(): number {
  return read<number>(KEYS.shareCount, 0);
}
export function incrementShareCount(): number {
  const next = getShareCount() + 1;
  write(KEYS.shareCount, next);
  return next;
}
export function setShareCount(n: number): void {
  write(KEYS.shareCount, n);
}

// ---- SNS いいね（投稿IDのセット） ----
export function getLikedPosts(): string[] {
  return read<string[]>(KEYS.postLikes, []);
}
export function toggleLike(postId: string): boolean {
  const liked = getLikedPosts();
  const isLiked = liked.includes(postId);
  const next = isLiked ? liked.filter((id) => id !== postId) : [...liked, postId];
  write(KEYS.postLikes, next);
  return !isLiked;
}

// ---- SNS コメント ----
export function getUserComments(): PostComment[] {
  return read<PostComment[]>(KEYS.postComments, []);
}
export function addUserComment(comment: PostComment): PostComment[] {
  const next = [...getUserComments(), comment];
  write(KEYS.postComments, next);
  return next;
}

// ---- SNS 星評価 ----
export function getPostStars(): Record<string, number> {
  return read<Record<string, number>>(KEYS.postStars, {});
}
export function setPostStar(postId: string, stars: number): void {
  const curr = getPostStars();
  write(KEYS.postStars, { ...curr, [postId]: stars });
}

// ---- ユーザープロフィール ----
export interface UserProfile {
  name: string;
  avatar: string;
  bio: string;
}

const DEFAULT_PROFILE: UserProfile = { name: "", avatar: "😊", bio: "" };

export function getProfile(): UserProfile {
  return { ...DEFAULT_PROFILE, ...read<Partial<UserProfile>>(KEYS.profile, {}) };
}

export function saveProfile(p: UserProfile): void {
  write(KEYS.profile, p);
}

// ---- 食べる予定（PlannedMeal[]） ----
export function getPlans(): PlannedMeal[] {
  return read<PlannedMeal[]>(KEYS.plans, []);
}
export function addPlan(plan: PlannedMeal): PlannedMeal[] {
  const next = [...getPlans(), plan];
  write(KEYS.plans, next);
  return next;
}

// ---- ロス削減アクション日付ログ（string[]） ----
export function getEcoActions(): string[] {
  return read<string[]>(KEYS.ecoActions, []);
}
export function recordEcoAction(dateISO: string): void {
  write(KEYS.ecoActions, [...getEcoActions(), dateISO]);
}

/** デモ用：全データをリセット */
export function resetAll(): void {
  if (!isBrowser()) return;
  Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
}
