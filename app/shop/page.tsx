"use client";

import { useEffect, useMemo, useState } from "react";
import { getProgress, getRedemptions, getFridge, saveProgress, addRedemption, genId } from "@/lib/storage";
import { REWARDS, genCouponCode } from "@/lib/loss";
import { availableStamps, redeemStamps } from "@/lib/xp";
import { PRODUCTS, recommendProducts } from "@/lib/products";
import OrderFlow from "@/components/OrderFlow";
import type { UserProgress, Reward, Redemption, Product, FoodItem } from "@/types";

const DEFAULT_PROGRESS: UserProgress = {
  level: 1, totalXP: 0, stamps: 0, cookingCount: 0, redeemedStamps: 0,
};

export default function ShopPage() {
  const [progress, setProgress]     = useState<UserProgress>(DEFAULT_PROGRESS);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [justRedeemed, setJustRedeemed] = useState<Redemption | null>(null);
  const [fridge, setFridge]         = useState<FoodItem[]>([]);
  const [ordering, setOrdering]     = useState<Product | null>(null);
  const [orderToast, setOrderToast] = useState<string | null>(null);
  const [tab, setTab]               = useState<"rewards" | "shop">("shop");

  useEffect(() => {
    setProgress(getProgress());
    setRedemptions(getRedemptions());
    setFridge(getFridge());
  }, []);

  const available = availableStamps(progress);
  const recommended = useMemo(() => recommendProducts(fridge, 2), [fridge]);
  const recommendedIds = new Set(recommended.map((p) => p.id));

  function handleRedeem(reward: Reward) {
    if (available < reward.cost) return;
    const next = redeemStamps(progress, reward.cost);
    saveProgress(next);
    setProgress(next);
    const r: Redemption = {
      id: genId(), rewardId: reward.id, rewardName: reward.name,
      code: genCouponCode(reward, Date.now()), cost: reward.cost, at: new Date().toISOString(),
    };
    addRedemption(r);
    setRedemptions((prev) => [r, ...prev]);
    setJustRedeemed(r);
  }

  function showToast(msg: string) {
    setOrderToast(msg);
    setTimeout(() => setOrderToast(null), 2600);
  }

  return (
    <div className="page pb-4">
      {/* ヘッダー */}
      <div className="hero-section mb-5 p-5">
        <div className="deco-circle-1" />
        <div className="deco-circle-2" />
        <p className="text-xs font-black text-white/70 tracking-widest uppercase mb-1">Shop</p>
        <h1 className="text-2xl font-black text-white">メシ活ショップ</h1>
        <p className="mt-0.5 text-sm text-white/80">¥390で補充・スタンプで特典ゲット</p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white/20 px-3 py-1.5">
          <span className="text-lg">🎟️</span>
          <span className="text-sm font-black text-white">
            使えるスタンプ <span className="text-lg">{available}</span> 枚
          </span>
        </div>
      </div>

      {/* タブ切り替え */}
      <div className="mb-4 flex gap-2 rounded-2xl bg-white/60 p-1 backdrop-blur-sm border border-white/80">
        <button
          onClick={() => setTab("shop")}
          className={`flex-1 rounded-xl py-2 text-sm font-black transition-all ${
            tab === "shop"
              ? "bg-gradient-to-br from-accent to-accent-dark text-white shadow-glow-accent"
              : "text-ink-soft"
          }`}
        >
          🍱 ¥390補充ショップ
        </button>
        <button
          onClick={() => setTab("rewards")}
          className={`flex-1 rounded-xl py-2 text-sm font-black transition-all ${
            tab === "rewards"
              ? "bg-gradient-to-br from-brand to-brand-dark text-white shadow-glow"
              : "text-ink-soft"
          }`}
        >
          🎟️ スタンプ特典
        </button>
      </div>

      {/* ¥390 補充ショップタブ */}
      {tab === "shop" && (
        <div className="space-y-3">
          {/* おすすめ（冷蔵庫連動） */}
          {recommended.length > 0 && (
            <>
              <p className="section-title">✨ あなたへのおすすめ</p>
              <div className="rounded-3xl border border-brand/20 bg-brand-light/60 p-3 space-y-2">
                {recommended.map((p) => (
                  <ProductRow key={p.id} product={p} highlight onOrder={() => setOrdering(p)} />
                ))}
              </div>
            </>
          )}

          {/* 全商品 */}
          <p className="section-title">🍱 商品一覧</p>
          <div className="space-y-2">
            {PRODUCTS.filter((p) => !recommendedIds.has(p.id)).map((p) => (
              <ProductRow key={p.id} product={p} onOrder={() => setOrdering(p)} />
            ))}
          </div>

          <div className="card-glass text-center py-3 mt-2">
            <p className="text-xs text-ink-soft">※ デモのため実際の決済は行われません</p>
          </div>
        </div>
      )}

      {/* スタンプ特典タブ */}
      {tab === "rewards" && (
        <div className="space-y-3">
          <p className="section-title">交換できる特典</p>
          {REWARDS.map((r) => {
            const canRedeem = available >= r.cost;
            const alreadyRedeemed = redemptions.some((d) => d.rewardId === r.id);
            return (
              <div key={r.id} className="card flex items-center gap-3">
                <span className="text-4xl">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-ink text-[15px]">{r.name}</p>
                  <p className="text-xs text-ink-soft mt-0.5">{r.partner}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5">
                    <span className="text-xs font-black text-brand">🎟️ {r.cost}枚</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRedeem(r)}
                  disabled={!canRedeem || alreadyRedeemed}
                  className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition-all active:scale-95 ${
                    alreadyRedeemed ? "bg-brand-light text-brand cursor-default"
                    : canRedeem     ? "btn-primary"
                    :                 "bg-cream text-ink-soft cursor-not-allowed"
                  }`}
                >
                  {alreadyRedeemed ? "交換済み" : canRedeem ? "交換する" : "不足"}
                </button>
              </div>
            );
          })}

          {redemptions.length > 0 && (
            <div className="mt-4">
              <p className="section-title">交換履歴</p>
              <div className="space-y-2">
                {redemptions.slice(0, 5).map((d) => (
                  <div key={d.id} className="card-soft flex items-center gap-3">
                    <span className="text-2xl">🎟️</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-ink truncate">{d.rewardName}</p>
                      <p className="text-xs text-ink-soft font-mono">{d.code}</p>
                    </div>
                    <span className="text-xs text-ink-soft">
                      {new Date(d.at).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-glass mt-2">
            <p className="text-sm font-black text-ink mb-2">🎟️ スタンプの貯め方</p>
            <ul className="space-y-1.5 text-xs text-ink-soft">
              <li className="flex gap-2"><span>📸</span><span>写真付き料理を投稿する → 1枚</span></li>
              <li className="flex gap-2"><span>✅</span><span>食品ロスゼロ週を達成 → ボーナス</span></li>
              <li className="flex gap-2"><span>⭐</span><span>キャラをレベルアップ → 自動付与</span></li>
            </ul>
          </div>
        </div>
      )}

      {/* スタンプ交換完了モーダル */}
      {justRedeemed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="card w-full max-w-xs text-center animate-pop-in">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-lg font-black text-ink">交換完了！</h3>
            <p className="mt-1 text-sm text-ink-soft">{justRedeemed.rewardName}</p>
            <div className="mt-4 rounded-2xl bg-brand-light p-3">
              <p className="text-xs text-brand-dark font-bold mb-1">クーポンコード</p>
              <p className="text-xl font-black text-brand tracking-widest">{justRedeemed.code}</p>
            </div>
            <p className="mt-3 text-xs text-ink-soft">提携店でこのコードを提示してください</p>
            <button onClick={() => setJustRedeemed(null)} className="btn-primary mt-4 w-full">閉じる</button>
          </div>
        </div>
      )}

      {/* 注文フロー */}
      {ordering && (
        <OrderFlow
          product={ordering}
          onClose={() => setOrdering(null)}
          onPlaced={({ xp }) => showToast(`注文完了（デモ）・予定に追加 ＋${xp} XP 🎉`)}
        />
      )}

      {/* 注文完了トースト */}
      {orderToast && (
        <div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 animate-toast-in">
          <div className="rounded-2xl bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-card-lg whitespace-nowrap">
            {orderToast}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductRow({ product, highlight, onOrder }: { product: Product; highlight?: boolean; onOrder: () => void }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-3 ${highlight ? "bg-white" : "card"}`}>
      <span className="text-3xl">{product.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-ink leading-tight">{product.name}</p>
        <p className="mt-0.5 text-xs text-ink-soft line-clamp-1">{product.description}</p>
        <p className="mt-0.5 text-[10px] text-ink-soft/70">冷凍で約{product.daysToKeep}日もつ</p>
      </div>
      <button
        onClick={onOrder}
        className="shrink-0 rounded-2xl bg-gradient-to-br from-accent to-accent-dark px-3 py-2 text-sm font-black text-white shadow-glow-accent active:scale-95 transition-all"
      >
        ¥{product.price}
      </button>
    </div>
  );
}
