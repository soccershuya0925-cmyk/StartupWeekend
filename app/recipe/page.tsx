"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getMyRecipes,
  addMyRecipe,
  removeMyRecipe,
  getFridge,
  genId,
} from "@/lib/storage";
import { decodeRecipe, type SharedRecipe } from "@/lib/recipeShare";
import RecipeShareButton from "@/components/RecipeShareButton";
import { COMMUNITY_RECIPES, shuffleRecipes, type CommunityRecipe } from "@/lib/communityRecipes";
import type { MyRecipe } from "@/types";

// ============================================================
// 共有リンクのビューワー（/recipe?d=...）
// ============================================================

function RecipeViewer({ recipe }: { recipe: SharedRecipe | null }) {
  const [owned, setOwned] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!recipe) return;
    const names = getFridge().map((f) => f.name);
    setOwned(
      new Set(
        recipe.ingredients.filter((ing) =>
          names.some((n) => n.includes(ing) || ing.includes(n))
        )
      )
    );
  }, [recipe]);

  if (!recipe) {
    return (
      <main className="page">
        <div className="mt-16 text-center">
          <p className="text-5xl">🍳</p>
          <p className="mt-3 text-sm font-bold text-ink">レシピが見つかりません</p>
          <p className="mt-1 text-xs text-ink-soft">リンクが正しくないようです。</p>
          <Link href="/" className="btn-primary mt-5 inline-flex">
            メシ活をひらく
          </Link>
        </div>
      </main>
    );
  }

  const missing = recipe.ingredients.filter((i) => !owned.has(i));

  return (
    <main className="page">
      <p className="text-xs font-bold tracking-widest text-accent">RECIPE</p>
      <h1 className="page-title">{recipe.name}</h1>
      {recipe.description && <p className="page-sub">{recipe.description}</p>}

      <section className="mt-5">
        <h2 className="section-title">🥬 材料</h2>
        <div className="flex flex-wrap gap-2">
          {recipe.ingredients.map((ing) => {
            const have = owned.has(ing);
            return (
              <span
                key={ing}
                className={`chip ${
                  have
                    ? "border-brand/30 bg-brand-light text-brand"
                    : "border-ink/15 bg-white text-ink-soft"
                }`}
              >
                {have ? "✓ " : ""}
                {ing}
              </span>
            );
          })}
        </div>
        {missing.length > 0 && (
          <p className="mt-2 text-xs text-ink-soft">
            足りない材料が {missing.length} 品あります
          </p>
        )}
      </section>

      {recipe.steps.length > 0 && (
        <section className="mt-6">
          <h2 className="section-title">👨‍🍳 作り方</h2>
          <ol className="space-y-2">
            {recipe.steps.map((s, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-2xl border border-black/5 bg-white p-3.5 shadow-card"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-black text-white">
                  {i + 1}
                </span>
                <span className="text-sm text-ink">{s}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mt-7 flex flex-col items-stretch gap-2">
        <RecipeShareButton recipe={recipe} variant="primary" label="このレシピを共有" />
        <Link href="/recipe" className="btn-outline">
          レシピ発見に戻る
        </Link>
      </div>
    </main>
  );
}

// ============================================================
// スワイプカード
// ============================================================

const SWIPE_THRESHOLD = 80;

interface SwipeCardProps {
  recipe: CommunityRecipe;
  onLike: () => void;
  onSkip: () => void;
}

function SwipeCard({ recipe, onLike, onSkip }: SwipeCardProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [flyDir, setFlyDir] = useState<"left" | "right" | null>(null);
  const startXRef = useRef(0);

  function flyAway(dir: "left" | "right") {
    setFlyDir(dir);
    setIsDragging(false);
    setTimeout(() => {
      if (dir === "left") onLike();
      else onSkip();
    }, 320);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (flyDir) return;
    startXRef.current = e.clientX;
    setIsDragging(true);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || flyDir) return;
    setDragX(e.clientX - startXRef.current);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || flyDir) return;
    setIsDragging(false);
    const dx = e.clientX - startXRef.current;
    if (dx < -SWIPE_THRESHOLD) flyAway("left");
    else if (dx > SWIPE_THRESHOLD) flyAway("right");
    else setDragX(0);
  }

  const rotation = flyDir
    ? flyDir === "left" ? -30 : 30
    : dragX * 0.06;

  const tx = flyDir
    ? flyDir === "left" ? -window.innerWidth * 1.5 : window.innerWidth * 1.5
    : dragX;

  const showLike = dragX < -30 || flyDir === "left";
  const showSkip = dragX > 30 || flyDir === "right";

  const diffColor =
    recipe.difficulty === "簡単"
      ? "bg-brand-light text-brand"
      : recipe.difficulty === "難しい"
      ? "bg-urgent/10 text-urgent"
      : "bg-slate-100 text-ink-soft";

  return (
    <div
      className="relative touch-none select-none cursor-grab active:cursor-grabbing"
      style={{
        transform: `translateX(${tx}px) rotate(${rotation}deg)`,
        transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
        transformOrigin: "50% 110%",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { setIsDragging(false); setDragX(0); }}
    >
      {/* カード本体 */}
      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-card">
        {/* 絵文字 visual */}
        <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-b from-cream to-white text-[7rem]">
          <span>{recipe.emoji}</span>

          {/* ❤️ いいね オーバーレイ */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-t-3xl bg-brand/10 backdrop-blur-[1px] transition-opacity"
            style={{ opacity: showLike ? Math.min(1, Math.abs(dragX) / 120) : 0 }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-6xl drop-shadow-lg">❤️</span>
              <span className="rounded-full bg-brand px-4 py-1 text-base font-black text-white">
                保存！
              </span>
            </div>
          </div>

          {/* スキップ オーバーレイ */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-t-3xl bg-slate-400/10 backdrop-blur-[1px] transition-opacity"
            style={{ opacity: showSkip ? Math.min(1, Math.abs(dragX) / 120) : 0 }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-6xl drop-shadow-lg">⏭️</span>
              <span className="rounded-full bg-slate-500 px-4 py-1 text-base font-black text-white">
                スキップ
              </span>
            </div>
          </div>
        </div>

        {/* テキスト情報 */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-black text-ink">{recipe.name}</h2>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${diffColor}`}>
                {recipe.difficulty}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-ink-soft">
                ⏱ {recipe.time}
              </span>
            </div>
          </div>

          <p className="mt-1.5 text-sm text-ink-soft">{recipe.description}</p>

          {/* 材料プレビュー */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recipe.ingredients.slice(0, 6).map((ing) => (
              <span
                key={ing}
                className="rounded-full border border-black/8 bg-cream px-2.5 py-0.5 text-xs font-semibold text-ink"
              >
                {ing}
              </span>
            ))}
            {recipe.ingredients.length > 6 && (
              <span className="rounded-full border border-black/8 bg-cream px-2.5 py-0.5 text-xs font-semibold text-ink-soft">
                +{recipe.ingredients.length - 6}
              </span>
            )}
          </div>

          {/* 著者 */}
          <div className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3">
            <span className="text-lg">{recipe.authorAvatar}</span>
            <span className="text-xs font-bold text-ink-soft">{recipe.authorName}</span>
            <span className="ml-auto text-xs font-bold text-ink-soft">
              ❤️ {recipe.likes.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// スワイプ発見画面
// ============================================================

function SwipeDiscovery() {
  const [deck, setDeck] = useState<CommunityRecipe[]>([]);
  const [current, setCurrent] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [mine, setMine] = useState<MyRecipe[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = getMyRecipes();
    setMine(saved);
    setSavedIds(new Set(saved.map((r) => r.id)));
    setDeck(shuffleRecipes(COMMUNITY_RECIPES));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  function handleLike(recipe: CommunityRecipe) {
    const newRecipe: MyRecipe = {
      id: recipe.id,
      name: recipe.name,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      description: recipe.description,
      createdAt: new Date().toISOString(),
    };
    const next = addMyRecipe(newRecipe);
    setMine(next);
    setSavedIds((prev) => new Set([...prev, recipe.id]));
    showToast(`❤️ 「${recipe.name}」を保存しました！`);
    setCurrent((c) => c + 1);
  }

  function handleSkip() {
    setCurrent((c) => c + 1);
  }

  function handleReset() {
    setDeck(shuffleRecipes(COMMUNITY_RECIPES));
    setCurrent(0);
  }

  function handleDeleteSaved(id: string) {
    setMine(removeMyRecipe(id));
    setSavedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }

  const remaining = deck.slice(current);
  const nextCard = remaining[1];

  return (
    <main className="page">
      {/* トースト */}
      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 animate-pop-in rounded-2xl bg-brand px-5 py-2.5 text-sm font-black text-white shadow-glow">
          {toast}
        </div>
      )}

      <header className="mb-4">
        <p className="text-xs font-bold tracking-widest text-accent">DISCOVER</p>
        <h1 className="page-title">📖 レシピ発見</h1>
        <p className="page-sub">左スワイプで保存、右スワイプでスキップ</p>
      </header>

      {/* スワイプエリア */}
      {remaining.length === 0 ? (
        /* 全部見終わった */
        <div className="rounded-3xl border border-black/5 bg-white p-8 text-center shadow-card">
          <p className="text-5xl">🎉</p>
          <p className="mt-3 font-black text-ink">全レシピを見ました！</p>
          <p className="mt-1 text-sm text-ink-soft">
            保存したレシピ: {savedIds.size} 件
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="btn-primary mt-5"
          >
            もう一度シャッフル
          </button>
        </div>
      ) : (
        <div className="relative" style={{ minHeight: 460 }}>
          {/* 次のカード（背景に薄く表示） */}
          {nextCard && (
            <div
              className="absolute inset-x-0 top-2 scale-95 rounded-3xl border border-black/5 bg-white opacity-60 shadow-card"
              style={{ zIndex: 0 }}
            >
              <div className="flex aspect-[4/3] w-full items-center justify-center text-[7rem] opacity-30">
                {nextCard.emoji}
              </div>
              <div className="h-32" />
            </div>
          )}

          {/* 現在のカード */}
          <div className="relative" style={{ zIndex: 1 }}>
            <SwipeCard
              key={current}
              recipe={remaining[0]}
              onLike={() => handleLike(remaining[0])}
              onSkip={handleSkip}
            />
          </div>

          {/* 操作ガイド（ボタン） */}
          <div className="mt-4 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={handleSkip}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-2xl shadow-card active:scale-95 transition-transform"
              aria-label="スキップ"
            >
              ⏭️
            </button>
            <div className="text-center text-xs font-semibold text-ink-soft">
              <p>残り {remaining.length} 件</p>
            </div>
            <button
              type="button"
              onClick={() => handleLike(remaining[0])}
              disabled={savedIds.has(remaining[0].id)}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand bg-brand-light text-2xl shadow-card active:scale-95 transition-transform disabled:opacity-40"
              aria-label="いいね・保存"
            >
              ❤️
            </button>
          </div>

          {/* 保存済み表示 */}
          {savedIds.has(remaining[0].id) && (
            <p className="mt-2 text-center text-xs font-bold text-brand">
              ✓ 保存済み
            </p>
          )}
        </div>
      )}

      {/* 区切り */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-black/8" />
        <span className="text-xs font-bold text-ink-soft">保存済みレシピ</span>
        <div className="h-px flex-1 bg-black/8" />
      </div>

      {/* 保存済みレシピ一覧 */}
      {mine.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-black/10 bg-cream p-6 text-center">
          <p className="text-3xl">📭</p>
          <p className="mt-2 text-sm font-bold text-ink-soft">
            まだ保存したレシピがありません
          </p>
          <p className="mt-1 text-xs text-ink-soft">左スワイプで保存しよう</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {mine.map((r) => (
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
                  onClick={() => handleDeleteSaved(r.id)}
                  className="shrink-0 text-xs font-bold text-ink-soft hover:text-urgent"
                >
                  削除
                </button>
              </div>
              <div className="mt-2">
                <RecipeShareButton recipe={r} variant="chip" label="共有" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 自作レシピへのリンク */}
      <Link
        href="/recipe/new"
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-brand/40 bg-brand-light/50 p-3.5 text-sm font-black text-brand"
      >
        ✍️ 自分のレシピを作る
      </Link>

      <div className="h-4" />
    </main>
  );
}

// ============================================================
// メインエントリ（?d= があればビューワー、なければスワイプ）
// ============================================================

export default function RecipePage() {
  const [mode, setMode] = useState<"loading" | "swipe" | "viewer">("loading");
  const [sharedRecipe, setSharedRecipe] = useState<SharedRecipe | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");
    if (d) {
      setSharedRecipe(decodeRecipe(d));
      setMode("viewer");
    } else {
      setMode("swipe");
    }
  }, []);

  if (mode === "loading") return <main className="page" />;
  if (mode === "viewer") return <RecipeViewer recipe={sharedRecipe} />;
  return <SwipeDiscovery />;
}
