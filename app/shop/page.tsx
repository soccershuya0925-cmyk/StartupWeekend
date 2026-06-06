"use client";

// 折衷C: ¥390 ショップ
// B のツールで可視化した「あと一品/ロス」を、A の ¥390 商品で解決して販売。
// 注文 → 「いつ食べる？」を設定（食習慣管理）→ XP。

import { useEffect, useState } from "react";
import { getFridge, getProgress, saveProgress, addPlan, genId } from "@/lib/storage";
import { applyXP, XP_REWARDS } from "@/lib/xp";
import {
  PRODUCTS,
  recommendProducts,
  type ProductSuggestion,
} from "@/lib/products";
import type { FoodItem, Product } from "@/types";

/** n 日後の YYYY-MM-DD */
function dateAfter(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function ShopPage() {
  const [fridge, setFridge] = useState<FoodItem[]>([]);
  const [recommended, setRecommended] = useState<ProductSuggestion[]>([]);
  // 注文ダイアログ対象＋食べる予定日
  const [ordering, setOrdering] = useState<Product | null>(null);
  const [eatDate, setEatDate] = useState(dateAfter(1));
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const f = getFridge();
    setFridge(f);
    setRecommended(recommendProducts(f, 2));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }

  function confirmOrder() {
    if (!ordering) return;
    // 食べる予定（食習慣）として登録
    addPlan({
      id: genId(),
      productName: ordering.name,
      emoji: ordering.emoji,
      eatDate,
      done: false,
      orderedAt: new Date().toISOString(),
    });
    // 「食べる予定を立てた」XP
    saveProgress(applyXP(getProgress(), XP_REWARDS.planMeal));
    showToast(
      `注文完了（デモ）¥${ordering.price} ・ +${XP_REWARDS.planMeal} XP 🎉`
    );
    setOrdering(null);
    setEatDate(dateAfter(1));
  }

  return (
    <main className="px-4 py-6">
      <h1 className="text-xl font-bold text-slate-800">🍱 ショップ</h1>
      <p className="mt-1 text-sm text-slate-500">
        あと一品を ¥{390} で。冷凍中心で日持ち、食べる日を決めて無駄なく。
      </p>

      {/* 使い切りXPのトースト */}
      {toast && (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-brand px-4 py-2 text-center text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* あなたへのおすすめ（冷蔵庫の状態に連動） */}
      {recommended.length > 0 && (
        <section className="mt-5">
          <h2 className="text-sm font-semibold text-slate-800">
            {fridge.length <= 2
              ? "🧊 冷蔵庫がさみしいので…"
              : "✨ あなたへのおすすめ"}
          </h2>
          <ul className="mt-2 space-y-2">
            {recommended.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand/5 p-3"
              >
                <span className="text-3xl" aria-hidden>
                  {p.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-brand">{p.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOrdering(p)}
                  className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                >
                  ¥{p.price}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 全商品 */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-800">すべての商品</h2>
        <ul className="mt-2 grid grid-cols-2 gap-3">
          {PRODUCTS.map((p) => (
            <li
              key={p.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-3"
            >
              <span className="text-4xl" aria-hidden>
                {p.emoji}
              </span>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {p.name}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                {p.description}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                冷凍で約{p.daysToKeep}日もつ
              </p>
              <button
                type="button"
                onClick={() => setOrdering(p)}
                className="mt-2 rounded-lg bg-brand py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
              >
                ¥{p.price} で注文
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* 注文ダイアログ: いつ食べる？（食習慣管理） */}
      {ordering && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden>
                {ordering.emoji}
              </span>
              <div>
                <p className="font-semibold text-slate-800">{ordering.name}</p>
                <p className="text-sm text-brand">¥{ordering.price}（都度払い）</p>
              </div>
            </div>

            <label className="mt-4 block text-xs font-semibold text-slate-600">
              いつ食べる？（食べる日を決めて無駄なく）
            </label>
            <input
              type="date"
              value={eatDate}
              onChange={(e) => setEatDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setOrdering(null)}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-500"
              >
                やめる
              </button>
              <button
                type="button"
                onClick={confirmOrder}
                className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                注文して予定に追加
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              ※ MVP デモのため実際の決済は行われません
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
