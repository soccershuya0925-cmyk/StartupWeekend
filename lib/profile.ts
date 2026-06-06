// ============================================================
// ユーザープロフィール（ニックネーム・食費の月間目標）の永続化
// 共通の storage.ts（土台ファイル）に触れず、自己完結で管理する
// SSR 中は window が無いので必ずガードする
// ============================================================

const PROFILE_KEY = "meshikatsu:profile";

export interface Profile {
  /** ニックネーム（任意） */
  name: string;
  /** 食費の月間目標（円） */
  monthlyBudgetYen: number;
}

export const DEFAULT_PROFILE: Profile = {
  name: "",
  monthlyBudgetYen: 30000,
};

const isBrowser = () => typeof window !== "undefined";

export function getProfile(): Profile {
  if (!isBrowser()) return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw
      ? { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<Profile>) }
      : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: Profile): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // 容量超過などは無視（MVP）
  }
}
