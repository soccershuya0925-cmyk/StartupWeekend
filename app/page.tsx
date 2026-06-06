"use client";

// 担当: エンジニアA（ホーム・ダッシュボード）
// docs/tasks/A-home-character.md の受け入れ条件に対応
// + 旬レシピ提案（機能③）とデモデータ投入を配線

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getProgress,
  saveProgress,
  getFridge,
  getPlans,
  updatePlan,
} from "@/lib/storage";
import { sortByExpiry, statusLabel, statusClasses, expiryStatus } from "@/lib/expiry";
import { suggestRecipes, seasonFromMonth, type RecipeSuggestion } from "@/lib/recommend";
import { recommendProducts, type ProductSuggestion } from "@/lib/products";
import { applyXP, XP_REWARDS } from "@/lib/xp";
import { seedDemo, clearDemo } from "@/lib/seed";
import CharacterDisplay from "@/components/CharacterDisplay";
import XPBar from "@/components/XPBar";
import type { FoodItem, UserProgress, PlannedMeal } from "@/types";

// storage の DEFAULT_PROGRESS 相当（SSR と初期描画の整合用）
const DEFAULT_PROGRESS: UserProgress = {
  level: 1,
  totalXP: 0,
  stamps: 0,
  cookingCount: 0,
};

export default function HomePage() {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [alerts, setAlerts] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [shopPicks, setShopPicks] = useState<ProductSuggestion[]>([]);
  const [plans, setPlans] = useState<PlannedMeal[]>([]);

  // localStorage 読み出しは useEffect 内（ハイドレーション不整合を避ける）
  useEffect(() => {
    const fridge = getFridge();
    setProgress(getProgress());
    setAlerts(sortByExpiry(fridge).slice(0, 3));
    // 旬（現在の月）× 手持ち食材 でおすすめレシピを算出
    const season = seasonFromMonth(new Date().getMonth() + 1);
    setRecipes(suggestRecipes(fridge, season, 3));
    // 折衷C: 冷蔵庫の状態に連動した ¥390 おすすめ
    setShopPicks(recommendProducts(fridge, 2));
    loadPlans();
  }, []);

  function loadPlans() {
    // 未完了の予定を、食べる日が近い順に
    const upcoming = getPlans()
      .filter((p) => !p.done)
      .sort((a, b) => a.eatDate.localeCompare(b.eatDate));
    setPlans(upcoming);
  }

  // 予定どおり食べた → 食習慣ボーナス XP
  function handleAte(plan: PlannedMeal) {
    updatePlan(plan.id, { done: true });
    const next = applyXP(getProgress(), XP_REWARDS.ateAsPlanned);
    saveProgress(next);
    setProgress(next);
    loadPlans();
  }

  return (
    <main className="px-4 py-6">
      <h1 className="text-xl font-bold text-slate-800">メシ活</h1>
      <p className="mt-1 text-sm text-slate-500">
        今日も食品ロスゼロを目指そう！
      </p>

      {/* キャラクター + XPバー */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <CharacterDisplay level={progress.level} />
        <div className="mt-4">
          <XPBar totalXP={progress.totalXP} />
        </div>
      </section>

      {/* 期限アラート */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-800">⏰ 期限が近い食材</h2>
        {alerts.length === 0 ? (
          <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
            期限が近い食材はありません。冷蔵庫に食材を追加しましょう。
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {alerts.map((item) => {
              const status = expiryStatus(item.expiryDate);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
                >
                  <span className="text-sm text-slate-700">
                    {statusLabel(item.expiryDate)}で{item.name}が期限切れ
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClasses(
                      status
                    )}`}
                  >
                    {statusLabel(item.expiryDate)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 食べる予定（折衷C: いつ・どれだけ食べるか）*/}
      {plans.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-slate-800">📅 食べる予定</h2>
          <ul className="mt-2 space-y-2">
            {plans.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
              >
                <span className="text-2xl" aria-hidden>
                  {p.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {p.productName}
                  </p>
                  <p className="text-xs text-slate-500">{p.eatDate} に食べる予定</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAte(p)}
                  className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                >
                  食べた +{XP_REWARDS.ateAsPlanned}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* あと一品どう？（折衷C: ¥390 販売導線・冷蔵庫の状態に連動）*/}
      {shopPicks.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              🍱 あと一品どう？（¥390）
            </h2>
            <Link href="/shop" className="text-xs font-semibold text-brand">
              ショップへ →
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {shopPicks.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-brand/30 bg-brand/5 p-3"
              >
                <span className="text-2xl" aria-hidden>
                  {p.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {p.name}
                  </p>
                  <p className="truncate text-xs text-brand">{p.reason}</p>
                </div>
                <Link
                  href="/shop"
                  className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                >
                  ¥{p.price}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 旬の料理提案（機能③）: 冷蔵庫の食材 × 季節 */}
      {recipes.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-slate-800">
            🍳 今ある食材で作れる旬レシピ
          </h2>
          <ul className="mt-2 space-y-2">
            {recipes.map((r) => (
              <li
                key={r.name}
                className="rounded-lg border border-brand/30 bg-brand/5 p-3"
              >
                <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                <p className="mt-0.5 text-xs text-slate-600">{r.description}</p>
                <p className="mt-1 text-xs text-brand">
                  使える食材: {r.matched.join("・")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* クイックアクション */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-800">クイックアクション</h2>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Link
            href="/cook"
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-brand px-4 py-6 text-white shadow-sm transition-transform active:scale-95"
          >
            <span className="text-3xl" aria-hidden>
              🍳
            </span>
            <span className="text-sm font-semibold">料理を記録</span>
          </Link>
          <Link
            href="/receipt"
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-brand bg-white px-4 py-6 text-brand shadow-sm transition-transform active:scale-95"
          >
            <span className="text-3xl" aria-hidden>
              🧾
            </span>
            <span className="text-sm font-semibold">レシート読取</span>
          </Link>
        </div>
      </section>

      {/* デモ用: ワンタップでサンプル投入 / リセット（発表・動作確認用） */}
      <section className="mt-10 border-t border-dashed border-slate-200 pt-4">
        <p className="text-xs text-slate-400">デモ用</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              seedDemo();
              window.location.reload();
            }}
            className="rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/5"
          >
            デモデータを投入
          </button>
          <button
            type="button"
            onClick={() => {
              clearDemo();
              window.location.reload();
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            全データをリセット
          </button>
        </div>
      </section>
    </main>
  );
}
