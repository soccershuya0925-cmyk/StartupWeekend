"use client";

// 設定 / プロフィール画面（/settings）
// ニックネーム・食費の月間目標・通知・データ管理・使い方を1画面に集約。
// ※ プロフィールは lib/profile.ts に自己完結で保存（土台 storage.ts は変更しない）。

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProfile, saveProfile, type Profile } from "@/lib/profile";
import { getProgress, getFridge } from "@/lib/storage";
import { stageFromLevel } from "@/lib/xp";
import { seedDemo, clearDemo } from "@/lib/seed";
import CharacterDisplay from "@/components/CharacterDisplay";
import NotifyToggle from "@/components/NotifyToggle";
import type { FoodItem, UserProgress } from "@/types";

const DEFAULT_PROGRESS: UserProgress = {
  level: 1,
  totalXP: 0,
  stamps: 0,
  cookingCount: 0,
};

const BUDGET_PRESETS = [20000, 30000, 40000];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({ name: "", monthlyBudgetYen: 30000 });
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [fridge, setFridge] = useState<FoodItem[]>([]);

  useEffect(() => {
    setProfile(getProfile());
    setProgress(getProgress());
    setFridge(getFridge());
  }, []);

  const stage = stageFromLevel(progress.level);

  /** 変更を即時に永続化（自動保存） */
  function persist(next: Profile) {
    setProfile(next);
    saveProfile(next);
  }

  return (
    <main className="page">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent">SETTINGS</p>
          <h1 className="page-title">⚙️ 設定</h1>
          <p className="page-sub">プロフィール・通知・データを管理</p>
        </div>
        <div className="text-4xl" aria-hidden>
          🛠️
        </div>
      </header>

      {/* プロフィール */}
      <section className="mt-5">
        <h2 className="section-title">👤 プロフィール</h2>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="shrink-0 rounded-3xl bg-brand-light p-2">
              <CharacterDisplay level={progress.level} size="md" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-soft">{stage.name}</p>
              <p className="text-2xl font-black leading-none text-ink">Lv.{progress.level}</p>
            </div>
          </div>
          <div className="mt-4">
            <label className="field-label" htmlFor="nickname">
              ニックネーム
            </label>
            <input
              id="nickname"
              className="field"
              value={profile.name}
              maxLength={20}
              placeholder="例：しゅうや"
              onChange={(e) => persist({ ...profile, name: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* 食費の月間目標 */}
      <section className="mt-5">
        <h2 className="section-title">🎯 食費の月間目標</h2>
        <div className="card">
          <p className="text-xs text-ink-soft">
            目標を決めると、節約できた金額の達成感がアップします。
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg font-black text-ink">¥</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              className="field flex-1"
              value={profile.monthlyBudgetYen}
              onChange={(e) =>
                persist({
                  ...profile,
                  monthlyBudgetYen: Math.max(0, Number(e.target.value) || 0),
                })
              }
            />
            <span className="shrink-0 text-sm font-bold text-ink-soft">/ 月</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {BUDGET_PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => persist({ ...profile, monthlyBudgetYen: v })}
                className={`chip ${
                  profile.monthlyBudgetYen === v
                    ? "border-brand bg-brand-light text-brand"
                    : "border-black/10 bg-white text-ink-soft"
                }`}
              >
                ¥{v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 通知 */}
      <section className="mt-5">
        <h2 className="section-title">🔔 通知</h2>
        <NotifyToggle items={fridge} />
      </section>

      {/* 使い方 */}
      <section className="mt-5">
        <h2 className="section-title">📖 使い方</h2>
        <button
          type="button"
          className="btn-outline w-full"
          onClick={() => window.dispatchEvent(new Event("meshikatsu:open-onboarding"))}
        >
          チュートリアルをもう一度見る
        </button>
      </section>

      {/* データ管理 */}
      <section className="mt-5">
        <h2 className="section-title">🗂 データ管理</h2>
        <div className="card space-y-2">
          <p className="text-xs text-ink-soft">
            発表・お試し用。端末内（localStorage）のデータだけを操作します。
          </p>
          <button
            type="button"
            className="btn-ghost w-full"
            onClick={() => {
              seedDemo();
              window.location.reload();
            }}
          >
            🌱 デモデータを投入
          </button>
          <button
            type="button"
            className="btn-outline w-full"
            onClick={() => {
              if (window.confirm("端末内のメシ活データをすべて消します。よろしいですか？")) {
                clearDemo();
                window.location.reload();
              }
            }}
          >
            🗑 全データをリセット
          </button>
        </div>
      </section>

      {/* アプリについて */}
      <section className="mb-2 mt-5">
        <h2 className="section-title">ℹ️ アプリについて</h2>
        <div className="card-soft text-sm text-ink-soft">
          <p className="font-black text-ink">
            メシ活 <span className="text-xs font-bold text-ink-soft">v0.1.0</span>
          </p>
          <p className="mt-1">
            一人暮らしの「食」の無駄をなくす。手軽・安い・うまいを入口に、気づけば食品ロスゼロへ。
          </p>
          <div className="mt-3">
            <Link href="/" className="text-xs font-bold text-brand">
              ← ホームにもどる
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
