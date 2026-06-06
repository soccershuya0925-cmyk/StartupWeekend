"use client";

import { useEffect, useState } from "react";
import { getProgress, getRedemptions, saveProgress, addRedemption, genId } from "@/lib/storage";
import { REWARDS, genCouponCode } from "@/lib/loss";
import { availableStamps, redeemStamps } from "@/lib/xp";
import type { UserProgress, Reward, Redemption } from "@/types";

const DEFAULT_PROGRESS: UserProgress = {
  level: 1, totalXP: 0, stamps: 0, cookingCount: 0, redeemedStamps: 0,
};

// 訳あり食材デモ商品
const BARGAIN_ITEMS = [
  { id: "b1", emoji: "🥦", name: "ブロッコリー", detail: "1玉", original: 198, price: 98, tag: "30%OFF", seller: "西友" },
  { id: "b2", emoji: "🐟", name: "サーモン切り身", detail: "2切れ", original: 450, price: 198, tag: "55%OFF", seller: "ライフ" },
  { id: "b3", emoji: "🍅", name: "ミニトマト", detail: "1パック", original: 248, price: 128, tag: "今夜限り", seller: "まいばすけっと" },
  { id: "b4", emoji: "🥚", name: "卵Mサイズ", detail: "10個", original: 258, price: 178, tag: "特売", seller: "OK" },
  { id: "b5", emoji: "🍄", name: "しめじ", detail: "2袋セット", original: 196, price: 88, tag: "訳あり", seller: "東急" },
  { id: "b6", emoji: "🥕", name: "にんじん袋", detail: "5本入り", original: 188, price: 98, tag: "40%OFF", seller: "西友" },
];

export default function ShopPage() {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [justRedeemed, setJustRedeemed] = useState<Redemption | null>(null);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [tab, setTab] = useState<"rewards" | "bargain">("rewards");

  useEffect(() => {
    setProgress(getProgress());
    setRedemptions(getRedemptions());
  }, []);

  const available = availableStamps(progress);

  function handleRedeem(reward: Reward) {
    if (available < reward.cost) return;
    const next = redeemStamps(progress, reward.cost);
    saveProgress(next);
    setProgress(next);
    const r: Redemption = {
      id: genId(),
      rewardId: reward.id,
      rewardName: reward.name,
      code: genCouponCode(reward, Date.now()),
      cost: reward.cost,
      at: new Date().toISOString(),
    };
    addRedemption(r);
    setRedemptions((prev) => [r, ...prev]);
    setJustRedeemed(r);
  }

  function handleCart(name: string) {
    setCartToast(`${name}をカートに追加しました`);
    setTimeout(() => setCartToast(null), 2200);
  }

  return (
    <div className="page pb-4">
      {/* ヘッダー */}
      <div className="hero-section mb-5 p-5">
        <div className="deco-circle-1" />
        <div className="deco-circle-2" />
        <p className="text-xs font-black text-white/70 tracking-widest uppercase mb-1">Shop</p>
        <h1 className="text-2xl font-black text-white">メシ活ショップ</h1>
        <p className="mt-0.5 text-sm text-white/80">スタンプで特典ゲット・訳あり食材をお得に</p>
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
          onClick={() => setTab("rewards")}
          className={`flex-1 rounded-xl py-2 text-sm font-black transition-all ${
            tab === "rewards"
              ? "bg-gradient-to-br from-brand to-brand-dark text-white shadow-glow"
              : "text-ink-soft"
          }`}
        >
          🎟️ スタンプ特典
        </button>
        <button
          onClick={() => setTab("bargain")}
          className={`flex-1 rounded-xl py-2 text-sm font-black transition-all ${
            tab === "bargain"
              ? "bg-gradient-to-br from-accent to-accent-dark text-white shadow-glow-accent"
              : "text-ink-soft"
          }`}
        >
          🥬 訳あり食材
        </button>
      </div>

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
                    alreadyRedeemed
                      ? "bg-brand-light text-brand cursor-default"
                      : canRedeem
                      ? "btn-primary"
                      : "bg-cream text-ink-soft cursor-not-allowed"
                  }`}
                >
                  {alreadyRedeemed ? "交換済み" : canRedeem ? "交換する" : "不足"}
                </button>
              </div>
            );
          })}

          {/* 交換成功モーダル */}
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
                <button
                  onClick={() => setJustRedeemed(null)}
                  className="btn-primary mt-4 w-full"
                >
                  閉じる
                </button>
              </div>
            </div>
          )}

          {/* 交換履歴 */}
          {redemptions.length > 0 && (
            <div className="mt-6">
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

          {/* スタンプの貯め方 */}
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

      {/* 訳あり食材タブ */}
      {tab === "bargain" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="section-title mb-0">今日の訳あり食材</p>
            <span className="text-xs text-ink-soft font-bold">デモ表示</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {BARGAIN_ITEMS.map((item) => (
              <div key={item.id} className="card p-3 flex flex-col gap-2">
                <div className="relative">
                  <div className="flex h-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cream to-white text-4xl">
                    {item.emoji}
                  </div>
                  <span className="absolute top-1 right-1 rounded-full bg-gradient-to-br from-accent to-accent-dark px-2 py-0.5 text-[10px] font-black text-white">
                    {item.tag}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-black text-ink leading-tight">{item.name}</p>
                  <p className="text-xs text-ink-soft">{item.detail} · {item.seller}</p>
                </div>
                <div className="flex items-end gap-1.5 mt-auto">
                  <span className="text-lg font-black text-accent">¥{item.price}</span>
                  <span className="text-xs text-ink-soft line-through mb-0.5">¥{item.original}</span>
                </div>
                <button
                  onClick={() => handleCart(item.name)}
                  className="w-full rounded-xl bg-gradient-to-br from-accent to-accent-dark py-1.5 text-xs font-black text-white active:scale-95 transition-all shadow-glow-accent"
                >
                  カートに追加
                </button>
              </div>
            ))}
          </div>

          <div className="card-glass mt-2 text-center py-4">
            <p className="text-2xl mb-1">🚀</p>
            <p className="text-sm font-black text-ink">近日リリース予定</p>
            <p className="text-xs text-ink-soft mt-1">近くのスーパーの訳あり食材をリアルタイム表示</p>
          </div>
        </div>
      )}

      {/* カートトースト */}
      {cartToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-toast-in">
          <div className="rounded-2xl bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-card-lg whitespace-nowrap">
            🛒 {cartToast}
          </div>
        </div>
      )}
    </div>
  );
}
