"use client";

// 担当: エンジニアA（ホーム・ダッシュボード）
// docs/tasks/A-home-character.md の受け入れ条件に対応
// + 旬レシピ提案（機能③）とデモデータ投入を配線

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProgress, getFridge, getLogs } from "@/lib/storage";
import { sortByExpiry, statusLabel, statusClasses, expiryStatus } from "@/lib/expiry";
import { suggestRecipes, seasonFromMonth, type RecipeSuggestion } from "@/lib/recommend";
import { seedDemo, clearDemo } from "@/lib/seed";
import { isEnabled, notifyExpiring } from "@/lib/notify";
import CharacterDisplay from "@/components/CharacterDisplay";
import XPBar from "@/components/XPBar";
import NotifyToggle from "@/components/NotifyToggle";
import RecipeShareButton from "@/components/RecipeShareButton";
import type { FoodItem, UserProgress } from "@/types";

// storage の DEFAULT_PROGRESS 相当（SSR と初期描画の整合用）
const DEFAULT_PROGRESS: UserProgress = {
  level: 1,
  totalXP: 0,
  stamps: 0,
  cookingCount: 0,
};

export default function HomePage() {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [fridge, setFridge] = useState<FoodItem[]>([]);
  const [alerts, setAlerts] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [fridgeCount, setFridgeCount] = useState(0);
  const [cookCount, setCookCount] = useState(0);

  // localStorage 読み出しは useEffect 内（ハイドレーション不整合を避ける）
  useEffect(() => {
    const items = getFridge();
    setProgress(getProgress());
    setFridge(items);
    setFridgeCount(items.length);
    setCookCount(getLogs().length);
    setAlerts(sortByExpiry(items).slice(0, 3));
    // 旬（現在の月）× 手持ち食材 でおすすめレシピを算出
    const season = seasonFromMonth(new Date().getMonth() + 1);
    setRecipes(suggestRecipes(items, season, 3));
    // 通知ON時は起動時に期限アラート（内部で1日1回にスロットル）
    if (isEnabled()) void notifyExpiring(items);
  }, []);

  return (
    <main className="page">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent">
            MESHIKATSU
          </p>
          <h1 className="page-title">メシ活</h1>
          <p className="page-sub">今日も食品ロスゼロを目指そう！</p>
        </div>
        <Link
          href="/settings"
          aria-label="設定"
          className="rounded-full p-1.5 text-3xl transition-transform active:scale-90"
        >
          ⚙️
        </Link>
      </header>

      {/* ヒーロー: キャラクター + XPバー + ステータス */}
      <section className="mt-5 overflow-hidden rounded-4xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-glow">
        <div className="flex items-center gap-4">
          <div className="shrink-0 rounded-3xl bg-white/15 p-2">
            <CharacterDisplay level={progress.level} size="md" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white/80">現在のレベル</p>
            <p className="text-3xl font-black leading-none">Lv.{progress.level}</p>
            <div className="mt-3">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/15">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-700"
                  style={{
                    width: `${Math.max(4, (progress.totalXP % 100))}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] font-semibold text-white/80">
                次のレベルまで {100 - (progress.totalXP % 100)} XP
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="冷蔵庫" value={`${fridgeCount}`} unit="品" />
          <Stat label="料理記録" value={`${cookCount}`} unit="回" />
          <Stat label="スタンプ" value={`${progress.stamps}`} unit="個" />
        </div>
      </section>

      {/* 今週の成果（週次サマリーへの導線） */}
      <section className="mt-4">
        <Link
          href="/summary"
          className="flex items-center gap-3 rounded-3xl border border-brand/20 bg-brand-light/50 p-4 transition-transform active:scale-[0.98]"
        >
          <span className="text-3xl" aria-hidden>
            📅
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black text-ink">今週の成果を見る</span>
            <span className="block text-xs text-ink-soft">
              救った食材・節約額・CO₂ を週次でチェック
            </span>
          </span>
          <span className="shrink-0 text-sm font-black text-brand">→</span>
        </Link>
      </section>

      {/* 期限アラート */}
      <section className="mt-6">
        <h2 className="section-title">⏰ 期限が近い食材</h2>
        {alerts.length === 0 ? (
          <p className="card-soft text-sm text-ink-soft">
            期限が近い食材はありません。冷蔵庫に食材を追加しましょう。
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((item) => {
              const status = expiryStatus(item.expiryDate);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-3.5 shadow-card"
                >
                  <span className="text-sm font-semibold text-ink">
                    <span aria-hidden>🥬 </span>
                    {item.name}
                  </span>
                  <span className={`chip ${statusClasses(status)}`}>
                    {statusLabel(item.expiryDate)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 期限通知のオプトイン */}
      <section className="mt-4">
        <NotifyToggle items={fridge} />
      </section>

      {/* 旬の料理提案（機能③）＋ レシピ共有 */}
      <section className="mt-6">
        <h2 className="section-title">
          🍳 旬レシピ
          <Link href="/recipe/new" className="ml-auto text-xs font-bold text-accent">
            ＋ 作って共有
          </Link>
        </h2>
        {recipes.length > 0 ? (
          <ul className="space-y-2">
            {recipes.map((r) => (
              <li
                key={r.name}
                className="rounded-2xl border border-brand/20 bg-brand-light/60 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black text-ink">{r.name}</p>
                  <RecipeShareButton
                    recipe={{
                      name: r.name,
                      ingredients: r.ingredients,
                      steps: r.steps ?? [],
                      description: r.description,
                    }}
                    variant="chip"
                  />
                </div>
                <p className="mt-0.5 text-xs text-ink-soft">{r.description}</p>
                <p className="mt-1.5 text-xs font-bold text-brand-dark">
                  <span aria-hidden>✓ </span>使える食材: {r.matched.join("・")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card-soft text-sm text-ink-soft">
            冷蔵庫に食材を入れると、使い切れる旬レシピを提案します。
          </p>
        )}
      </section>

      {/* 補充の提案（折衷案）: 在庫が少ない or 期限が近いとき */}
      {(fridgeCount < 5 || alerts.length > 0) && (
        <section className="mt-6">
          <Link
            href="/shop"
            className="flex items-center gap-3 rounded-3xl border border-accent/20 bg-accent-light/50 p-4 transition-transform active:scale-[0.98]"
          >
            <span className="text-3xl" aria-hidden>
              🛒
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-ink">
                在庫が少なくなっています
              </span>
              <span className="block text-xs text-ink-soft">
                足りない食材を390円から補充できます
              </span>
            </span>
            <span className="shrink-0 text-sm font-black text-accent">補充 →</span>
          </Link>
        </section>
      )}

      {/* クイックアクション */}
      <section className="mt-6">
        <h2 className="section-title">クイックアクション</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/cook"
            className="flex flex-col items-center justify-center gap-1.5 rounded-3xl bg-accent px-4 py-6 text-white shadow-card transition-transform active:scale-95"
          >
            <span className="text-3xl" aria-hidden>
              🍳
            </span>
            <span className="text-sm font-black">料理を記録</span>
          </Link>
          <Link
            href="/receipt"
            className="flex flex-col items-center justify-center gap-1.5 rounded-3xl border-2 border-brand bg-white px-4 py-6 text-brand transition-transform active:scale-95"
          >
            <span className="text-3xl" aria-hidden>
              🧾
            </span>
            <span className="text-sm font-black">レシート読取</span>
          </Link>
        </div>
      </section>

      {/* デモ用: ワンタップでサンプル投入 / リセット（発表・動作確認用） */}
      <section className="mt-10 border-t border-dashed border-ink/15 pt-4">
        <p className="text-xs font-bold text-ink-soft/60">デモ用</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              seedDemo();
              window.location.reload();
            }}
            className="rounded-xl border border-brand px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand-light"
          >
            デモデータを投入
          </button>
          <button
            type="button"
            onClick={() => {
              clearDemo();
              window.location.reload();
            }}
            className="rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-cream"
          >
            全データをリセット
          </button>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("meshikatsu:open-onboarding"))
            }
            className="rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-cream"
          >
            チュートリアルを見る
          </button>
        </div>
      </section>
    </main>
  );
}

/** ヒーロー内の小さなステータス表示 */
function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl bg-white/15 py-2">
      <p className="text-[10px] font-semibold text-white/70">{label}</p>
      <p className="text-lg font-black leading-none">
        {value}
        <span className="text-[11px] font-bold">{unit}</span>
      </p>
    </div>
  );
}
