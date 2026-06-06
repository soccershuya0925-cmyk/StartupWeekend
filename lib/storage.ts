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
  Order,
  MyRecipe,
} from "@/types";

const KEYS = {
  fridge: "meshikatsu:fridge",
  logs: "meshikatsu:logs",
  progress: "meshikatsu:progress",
  lossEvents: "meshikatsu:lossEvents",
  redemptions: "meshikatsu:redemptions",
  zeroLossWeeks: "meshikatsu:zeroLossWeeks", // 付与済みの「ロスゼロ週間」数
  orders: "meshikatsu:orders",
  myRecipes: "meshikatsu:myRecipes",
  shareCount: "meshikatsu:shareCount", // SNSシェア回数（影響力スコアに使う）
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
  // 既存データに無い新フィールド（redeemedStamps 等）はデフォルトで補完する
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

// ---- 注文履歴（Order[]・補充） ----
export function getOrders(): Order[] {
  return read<Order[]>(KEYS.orders, []);
}
export function addOrder(order: Order): Order[] {
  const next = [order, ...getOrders()];
  write(KEYS.orders, next);
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

/** デモ用：全データをリセット */
export function resetAll(): void {
  if (!isBrowser()) return;
  Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
}
