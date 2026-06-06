"use client";

// 補充ショップ（折衷案 /shop）
// 在庫が薄い/期限が近いとき ¥390 商品を補充。買うと冷蔵庫に入り、
// 「補充→使い切り→ロス削減」のループが回る。※デモ＝実決済なし。

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getFridge,
  addFoodItem,
  getOrders,
  addOrder,
  genId,
} from "@/lib/storage";
import {
  PRODUCTS,
  productToFoodItem,
  recommendReplenishment,
  buildOrderLines,
} from "@/lib/shop";
import Toast from "@/components/Toast";
import type { FoodItem, Order, ShopProduct } from "@/types";

export default function ShopPage() {
  const [fridge, setFridge] = useState<FoodItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setFridge(getFridge());
    setOrders(getOrders());
  }, []);

  const recommended = useMemo(() => recommendReplenishment(fridge, 3), [fridge]);
  const recommendedIds = new Set(recommended.map((p) => p.id));

  const lines = buildOrderLines(cart);
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  const totalYen = lines.reduce((s, l) => s + l.qty * l.price, 0);

  function add(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }
  function sub(id: string) {
    setCart((c) => {
      const n = (c[id] ?? 0) - 1;
      const next = { ...c };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });
  }

  /** 注文（デモ）: 各商品を冷蔵庫に追加し、注文履歴に残す */
  function checkout() {
    if (lines.length === 0) return;
    const now = new Date();
    for (const line of lines) {
      const product = PRODUCTS.find((p) => p.id === line.productId)!;
      for (let i = 0; i < line.qty; i++) {
        addFoodItem(productToFoodItem(product, now));
      }
    }
    const order: Order = {
      id: genId(),
      lines,
      total: totalYen,
      at: now.toISOString(),
    };
    setOrders(addOrder(order));
    setFridge(getFridge());
    setCart({});
    setToast(`${totalQty}点を冷蔵庫に補充しました（¥${totalYen.toLocaleString()}）🛒`);
  }

  return (
    <main className="page">
      <Toast message={toast} onDone={() => setToast(null)} />

      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent">REFILL</p>
          <h1 className="page-title">🛒 390円で補充</h1>
          <p className="page-sub">足りない食材をワンタップで。買うと冷蔵庫に入ります。</p>
        </div>
        <div className="text-4xl" aria-hidden>
          🧊
        </div>
      </header>

      {/* おすすめ補充（在庫に無いカテゴリ優先） */}
      {recommended.length > 0 && (
        <section className="mt-5">
          <h2 className="section-title">✨ あなたへのおすすめ</h2>
          <div className="rounded-3xl border border-brand/20 bg-brand-light/60 p-3">
            <ul className="space-y-2">
              {recommended.map((p) => (
                <ProductRow
                  key={p.id}
                  p={p}
                  qty={cart[p.id] ?? 0}
                  onAdd={() => add(p.id)}
                  onSub={() => sub(p.id)}
                  highlight
                />
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 全商品 */}
      <section className="mt-6">
        <h2 className="section-title">🍱 商品一覧</h2>
        <ul className="space-y-2">
          {PRODUCTS.filter((p) => !recommendedIds.has(p.id)).map((p) => (
            <ProductRow
              key={p.id}
              p={p}
              qty={cart[p.id] ?? 0}
              onAdd={() => add(p.id)}
              onSub={() => sub(p.id)}
            />
          ))}
        </ul>
      </section>

      {/* 注文履歴 */}
      {orders.length > 0 && (
        <section className="mt-6">
          <h2 className="section-title">📦 補充履歴</h2>
          <ul className="space-y-2">
            {orders.slice(0, 5).map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-3 text-sm shadow-card"
              >
                <span className="font-semibold text-ink">
                  {o.lines.reduce((s, l) => s + l.qty, 0)}点 補充
                </span>
                <span className="font-black text-ink">¥{o.total.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 text-center text-[11px] text-ink-soft/70">
        ※ デモのため実際の決済は行われません
      </p>

      {/* 下部固定のカートバー（ナビの上に重ねる） */}
      {totalQty > 0 && (
        <div className="fixed inset-x-0 bottom-[68px] z-40 px-4">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink p-3 text-white shadow-card">
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-white/70">{totalQty}点</p>
              <p className="text-lg font-black leading-none">¥{totalYen.toLocaleString()}</p>
            </div>
            <button
              type="button"
              onClick={checkout}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-black text-white hover:bg-accent-dark"
            >
              注文する（デモ）
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-center">
        <Link href="/fridge" className="text-xs font-bold text-brand">
          冷蔵庫を見る →
        </Link>
      </div>
    </main>
  );
}

/** 商品1行（数量ステッパー付き） */
function ProductRow({
  p,
  qty,
  onAdd,
  onSub,
  highlight,
}: {
  p: ShopProduct;
  qty: number;
  onAdd: () => void;
  onSub: () => void;
  highlight?: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border p-3 ${
        highlight ? "border-brand/20 bg-white" : "border-black/5 bg-white shadow-card"
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cream text-2xl" aria-hidden>
        {p.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-ink">
          {p.name}
          {p.tag && (
            <span className="ml-1.5 rounded bg-brand-light px-1.5 py-0.5 text-[10px] font-bold text-brand">
              {p.tag}
            </span>
          )}
        </p>
        <p className="text-xs font-bold text-ink-soft">¥{p.price.toLocaleString()}</p>
      </div>
      {qty > 0 ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onSub}
            aria-label="減らす"
            className="h-8 w-8 rounded-full border border-ink/15 text-lg font-black text-ink-soft"
          >
            −
          </button>
          <span className="w-5 text-center text-sm font-black text-ink">{qty}</span>
          <button
            type="button"
            onClick={onAdd}
            aria-label="増やす"
            className="h-8 w-8 rounded-full bg-brand text-lg font-black text-white"
          >
            ＋
          </button>
        </div>
      ) : (
        <button type="button" onClick={onAdd} className="btn-ghost shrink-0 px-3 py-2 text-xs">
          ＋ カート
        </button>
      )}
    </li>
  );
}
