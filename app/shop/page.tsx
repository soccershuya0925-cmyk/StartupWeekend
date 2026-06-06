"use client";

// 折衷C: ¥390 ショップ
// B のツールで可視化した「あと一品/ロス」を、A の ¥390 商品で解決して販売。
// 注文 →（いつ食べる？）→ 受け取り方法/時間（ピザクック方式）→ QR/ロッカー解錠 → XP。

import { useEffect, useState } from "react";
import { getFridge } from "@/lib/storage";
import {
  PRODUCTS,
  recommendProducts,
  type ProductSuggestion,
} from "@/lib/products";
import type { FoodItem, Product } from "@/types";
import OrderFlow from "@/components/OrderFlow";

export default function ShopPage() {
  const [fridge, setFridge] = useState<FoodItem[]>([]);
  const [recommended, setRecommended] = useState<ProductSuggestion[]>([]);
  const [ordering, setOrdering] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const f = getFridge();
    setFridge(f);
    setRecommended(recommendProducts(f, 2));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }

  return (
    <main className="px-4 py-6">
      <h1 className="text-xl font-bold text-slate-800">🍱 ショップ</h1>
      <p className="mt-1 text-sm text-slate-500">
        あと一品を ¥{390} で。冷凍中心で日持ち、食べる日を決めて無駄なく。
      </p>

      {/* トースト */}
      {toast && (
        <div className="fixed inset-x-0 top-4 z-[60] mx-auto w-fit max-w-[90%] rounded-full bg-brand px-4 py-2 text-center text-sm font-semibold text-white shadow-lg">
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

      {/* 注文フロー（いつ食べる？→ 受け取り方法/時間 → QR/ロッカー解錠 → XP） */}
      {ordering && (
        <OrderFlow
          product={ordering}
          onClose={() => setOrdering(null)}
          onPlaced={({ xp }) =>
            showToast(`注文完了（デモ）・予定に追加 ＋${xp} XP 🎉`)
          }
        />
      )}
    </main>
  );
}
