"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getProfile,
  saveProfile,
  getMyRecipes,
  removeMyRecipe,
  getLogs,
  getLossEvents,
  getShareCount,
  resetAll,
  type UserProfile,
} from "@/lib/storage";
import { computeLossStats } from "@/lib/loss";
import { computeInfluenceScore, titleFromScore } from "@/lib/influence";
import RecipeShareButton from "@/components/RecipeShareButton";
import type { MyRecipe } from "@/types";

// アバター候補
const AVATAR_OPTIONS = [
  "😊","😎","🤩","🧑‍🍳","👩‍🍳","👨‍🍳",
  "🍳","🍽️","🥘","🍜","🍱","🍣",
  "🍛","🍝","🌮","🍔","🥗","🎂",
];

// ============================================================
// アバターピッカーモーダル
// ============================================================

function AvatarPicker({
  current,
  onSelect,
  onClose,
}: {
  current: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-4 text-center text-sm font-black text-ink">アバターを選ぶ</p>
        <div className="grid grid-cols-6 gap-3">
          {AVATAR_OPTIONS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => { onSelect(em); onClose(); }}
              className={`flex aspect-square items-center justify-center rounded-2xl text-3xl transition-all active:scale-90 ${
                current === em
                  ? "bg-brand-light ring-2 ring-brand"
                  : "bg-cream hover:bg-brand-light/50"
              }`}
            >
              {em}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// プロフィールセクション
// ============================================================

function ProfileSection() {
  const [profile, setProfile] = useState<UserProfile>({ name: "", avatar: "😊", bio: "" });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>({ name: "", avatar: "😊", bio: "" });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    setDraft(p);
  }, []);

  function handleSave() {
    saveProfile(draft);
    setProfile(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-card">
      {/* ヘッダー帯 */}
      <div className="bg-gradient-to-r from-brand to-brand-dark px-5 py-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => editing && setShowAvatarPicker(true)}
            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-4xl"
          >
            {editing ? draft.avatar : profile.avatar}
            {editing && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px]">
                ✏️
              </span>
            )}
          </button>
          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="名前を入力"
                maxLength={20}
                className="w-full rounded-xl bg-white/20 px-3 py-1.5 text-base font-black text-white placeholder-white/60 outline-none focus:bg-white/30"
              />
            ) : (
              <p className="text-lg font-black text-white">
                {profile.name || "名前を設定してください"}
              </p>
            )}
            {editing ? (
              <input
                type="text"
                value={draft.bio}
                onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                placeholder="ひとことを入力（任意）"
                maxLength={40}
                className="mt-1 w-full rounded-xl bg-white/20 px-3 py-1 text-xs text-white placeholder-white/60 outline-none focus:bg-white/30"
              />
            ) : (
              <p className="mt-0.5 text-sm text-white/80">
                {profile.bio || "ひとこと未設定"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 編集ボタン */}
      <div className="px-5 py-3">
        {editing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary flex-1 py-2 text-sm"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => { setDraft(profile); setEditing(false); }}
              className="btn-ghost flex-1 py-2 text-sm"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(profile); setEditing(true); }}
            className="w-full rounded-2xl border border-brand/30 py-2 text-sm font-black text-brand"
          >
            ✏️ プロフィールを編集
          </button>
        )}
        {saved && (
          <p className="mt-1.5 text-center text-xs font-bold text-brand">
            ✓ 保存しました
          </p>
        )}
      </div>

      {showAvatarPicker && (
        <AvatarPicker
          current={draft.avatar}
          onSelect={(v) => setDraft((d) => ({ ...d, avatar: v }))}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </section>
  );
}

// ============================================================
// 保存済みレシピセクション
// ============================================================

function SavedRecipesSection() {
  const [recipes, setRecipes] = useState<MyRecipe[]>([]);

  useEffect(() => {
    setRecipes(getMyRecipes());
  }, []);

  function handleDelete(id: string) {
    setRecipes(removeMyRecipe(id));
  }

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title mb-0">❤️ 保存済みレシピ</h2>
        <Link href="/recipe" className="text-xs font-black text-brand">
          発見する →
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-black/10 bg-cream p-6 text-center">
          <p className="text-3xl">📭</p>
          <p className="mt-2 text-sm font-bold text-ink-soft">
            保存したレシピがまだありません
          </p>
          <Link href="/recipe" className="btn-primary mt-3 inline-block text-sm">
            レシピを探しに行く
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {recipes.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-black/5 bg-white p-3.5 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-ink">{r.name}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">
                    {r.ingredients.slice(0, 5).join("・")}
                    {r.ingredients.length > 5 ? "…" : ""}
                  </p>
                  {r.description && (
                    <p className="mt-0.5 text-xs text-ink-soft">{r.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  className="shrink-0 rounded-xl px-2 py-1 text-xs font-bold text-ink-soft hover:bg-urgent/10 hover:text-urgent"
                >
                  削除
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <RecipeShareButton recipe={r} variant="chip" label="共有" />
                <Link
                  href={`/recipe/new`}
                  className="chip border-brand/20 bg-brand-light/50 text-brand text-xs"
                >
                  詳細
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/recipe/new"
        className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-brand/30 bg-brand-light/40 p-3 text-sm font-black text-brand"
      >
        ✍️ 自分のレシピを作る
      </Link>
    </section>
  );
}

// ============================================================
// 活動サマリー
// ============================================================

function ActivitySummary() {
  const [stats, setStats] = useState({
    posts: 0,
    savedRecipes: 0,
    savedYen: 0,
    influenceTitle: "見習いシェフの卵",
    influenceEmoji: "🥚",
  });

  useEffect(() => {
    const logs = getLogs();
    const lossStats = computeLossStats(getLossEvents());
    const inf = computeInfluenceScore({
      cookCount: logs.length,
      shareCount: getShareCount(),
      savedCount: lossStats.savedCount,
      streakDays: lossStats.streakDays,
    });
    const title = titleFromScore(inf.total);
    setStats({
      posts: logs.length,
      savedRecipes: getMyRecipes().length,
      savedYen: lossStats.savedYen,
      influenceTitle: title.title,
      influenceEmoji: title.emoji,
    });
  }, []);

  return (
    <section className="mt-6">
      <h2 className="section-title">📊 活動サマリー</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-card">
          <p className="text-xs font-bold text-ink-soft">投稿数</p>
          <p className="mt-1 text-3xl font-black text-ink">{stats.posts}</p>
          <p className="mt-0.5 text-xs text-ink-soft">料理</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-card">
          <p className="text-xs font-bold text-ink-soft">保存レシピ</p>
          <p className="mt-1 text-3xl font-black text-ink">{stats.savedRecipes}</p>
          <p className="mt-0.5 text-xs text-ink-soft">件</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-card">
          <p className="text-xs font-bold text-ink-soft">節約合計</p>
          <p className="mt-1 text-2xl font-black text-ink">
            ¥{stats.savedYen.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">食品ロス削減</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-card">
          <p className="text-xs font-bold text-ink-soft">ランク</p>
          <p className="mt-1 text-2xl">{stats.influenceEmoji}</p>
          <p className="mt-0.5 text-xs font-bold text-ink-soft leading-snug">
            {stats.influenceTitle}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Link href="/character" className="btn-ghost flex-1 text-sm">
          ⭐ キャラ詳細
        </Link>
        <Link href="/stats" className="btn-ghost flex-1 text-sm">
          📊 ロスレポート
        </Link>
      </div>
    </section>
  );
}

// ============================================================
// 設定セクション
// ============================================================

function SettingsSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  function handleReset() {
    resetAll();
    setShowConfirm(false);
    setDone(true);
    setTimeout(() => window.location.reload(), 800);
  }

  return (
    <section className="mt-6">
      <h2 className="section-title">⚙️ 設定</h2>
      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-card">

        {/* リンク一覧 */}
        <Link
          href="/fridge"
          className="flex items-center gap-3 border-b border-black/5 px-5 py-4"
        >
          <span className="text-xl">🧊</span>
          <span className="flex-1 text-sm font-bold text-ink">冷蔵庫を管理</span>
          <span className="text-ink-soft">›</span>
        </Link>
        <Link
          href="/receipt"
          className="flex items-center gap-3 border-b border-black/5 px-5 py-4"
        >
          <span className="text-xl">🧾</span>
          <span className="flex-1 text-sm font-bold text-ink">レシートを読み取る</span>
          <span className="text-ink-soft">›</span>
        </Link>
        <Link
          href="/stats"
          className="flex items-center gap-3 border-b border-black/5 px-5 py-4"
        >
          <span className="text-xl">📊</span>
          <span className="flex-1 text-sm font-bold text-ink">ロス削減レポートを見る</span>
          <span className="text-ink-soft">›</span>
        </Link>

        {/* デモリセット */}
        <div className="px-5 py-4">
          {!showConfirm ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex w-full items-center gap-3"
            >
              <span className="text-xl">🗑️</span>
              <span className="flex-1 text-left text-sm font-bold text-urgent">
                全データをリセット
              </span>
              <span className="text-ink-soft">›</span>
            </button>
          ) : (
            <div className="rounded-2xl bg-urgent/5 p-4">
              <p className="text-sm font-bold text-urgent">
                本当にリセットしますか？
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                冷蔵庫・料理記録・レシピなどすべて削除されます。
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 rounded-xl bg-urgent py-2 text-sm font-black text-white"
                >
                  {done ? "リセット完了…" : "リセット"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-xl border border-black/10 py-2 text-sm font-bold text-ink-soft"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* バージョン */}
      <p className="mt-4 text-center text-xs text-ink-soft">
        メシ活 MVP v0.1 · Startup Weekend 新宮町 2026
      </p>
    </section>
  );
}

// ============================================================
// ページ本体
// ============================================================

export default function ProfilePage() {
  return (
    <main className="page">
      <header className="mb-5">
        <p className="text-xs font-bold tracking-widest text-accent">MY PAGE</p>
        <h1 className="page-title">👤 マイページ</h1>
      </header>

      <ProfileSection />
      <ActivitySummary />
      <SavedRecipesSection />
      <SettingsSection />

      <div className="h-4" />
    </main>
  );
}
