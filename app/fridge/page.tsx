"use client";

// 担当: エンジニアB（冷蔵庫管理 /fridge）
// 食材の在庫一覧（期限が近い順・色分け）と手動の追加・削除。
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getFridge,
  addFoodItem,
  removeFoodItem,
  genId,
  getProgress,
  saveProgress,
  addLossEvent,
  getZeroLossWeeks,
  setZeroLossWeeks,
} from "@/lib/storage";
import { expiryStatus, statusClasses, statusLabel, sortByExpiry } from "@/lib/expiry";
import { applyXP, XP_REWARDS, stageFromLevel } from "@/lib/xp";
import {
  estimatedYen,
  computeLossStats,
  newZeroLossWeeks,
} from "@/lib/loss";
import Toast from "@/components/Toast";
import LevelUpCelebration from "@/components/LevelUpCelebration";
import type { FoodItem, FoodCategory } from "@/types";

// カテゴリのセレクト用ラベル＆アイコン（型 FoodCategory に厳密に対応）
const CATEGORY_OPTIONS: { value: FoodCategory; label: string; icon: string }[] = [
  { value: "vegetable", label: "野菜", icon: "🥬" },
  { value: "meat", label: "肉・魚", icon: "🍖" },
  { value: "dairy", label: "乳製品・卵", icon: "🥚" },
  { value: "seasoning", label: "調味料", icon: "🧂" },
  { value: "other", label: "その他", icon: "🍱" },
];

const CATEGORY_ICON: Record<FoodCategory, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((c) => [c.value, c.icon])
) as Record<FoodCategory, string>;

export default function FridgePage() {
  const [items, setItems] = useState<FoodItem[]>([]);

  // フォーム入力 state
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("個");
  const [category, setCategory] = useState<FoodCategory>("vegetable");
  const [expiryDate, setExpiryDate] = useState("");
  const [showForm, setShowForm] = useState(false);

  // フィードバック
  const [toast, setToast] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number; newStage: boolean } | null>(null);

  // localStorage 読み出しは useEffect 内（SSR/ハイドレーション不整合を避ける）
  useEffect(() => {
    setItems(getFridge());
  }, []);

  // 期限が近い順に並べた一覧
  const sorted = sortByExpiry(items);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    // 名前と消費期限は必須
    if (!name.trim() || !expiryDate) return;

    const item: FoodItem = {
      id: genId(),
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit: unit.trim() || "個",
      expiryDate, // <input type="date"> の値そのまま (YYYY-MM-DD)
      category,
      addedAt: new Date().toISOString(),
    };
    setItems(addFoodItem(item));

    // 入力をリセット（カテゴリ・単位は次入力でも使いやすいよう残す）
    setName("");
    setQuantity("1");
    setExpiryDate("");
    setToast(`${item.name}を追加しました`);
  }

  function handleRemove(id: string) {
    setItems(removeFoodItem(id));
  }

  /** 期限内に使い切れたら +100XP ボーナス（機能④）＋ロス削減「救った」を記録 */
  function handleUse(item: FoodItem) {
    setItems(removeFoodItem(item.id));

    const before = getProgress();
    // ロス削減イベント記録: 救った（節約額は実価格 or 概算）
    const events = addLossEvent({
      id: genId(),
      type: "saved",
      itemName: item.name,
      estimatedYen: estimatedYen(item),
      at: new Date().toISOString(),
    });

    // 使い切りボーナス +100XP
    let after = applyXP(before, XP_REWARDS.useBeforeExpiry);

    // ロスゼロ週間ボーナス: 7日連続ロスゼロを新たに達成したら +500XP
    const stats = computeLossStats(events);
    const award = newZeroLossWeeks(stats.zeroLossWeeks, getZeroLossWeeks());
    let weekBonus = false;
    if (award > 0) {
      after = applyXP(after, XP_REWARDS.zeroLossWeek * award);
      setZeroLossWeeks(stats.zeroLossWeeks);
      weekBonus = true;
    }
    saveProgress(after);

    setToast(
      weekBonus
        ? `ロスゼロ週間達成！ +${XP_REWARDS.zeroLossWeek} XP 🔥`
        : `期限内に使い切った！ +${XP_REWARDS.useBeforeExpiry} XP 🎉`
    );
    if (after.level > before.level) {
      setLevelUp({
        level: after.level,
        newStage:
          stageFromLevel(after.level).stage !== stageFromLevel(before.level).stage,
      });
    }
  }

  /** 期限切れで処分: ロス削減「捨てた」を記録（XPなし） */
  function handleDiscard(item: FoodItem) {
    setItems(removeFoodItem(item.id));
    addLossEvent({
      id: genId(),
      type: "wasted",
      itemName: item.name,
      estimatedYen: estimatedYen(item),
      at: new Date().toISOString(),
    });
    setToast(`${item.name}を処分しました。次は早めに使おう…`);
  }

  return (
    <main className="page">
      <Toast message={toast} onDone={() => setToast(null)} />
      <LevelUpCelebration
        level={levelUp?.level ?? null}
        newStage={levelUp?.newStage}
        onClose={() => setLevelUp(null)}
      />

      <header className="flex items-end justify-between">
        <div>
          <h1 className="page-title">🧊 冷蔵庫</h1>
          <p className="page-sub">
            期限内に「使った」で +{XP_REWARDS.useBeforeExpiry} XP！
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
        >
          {showForm ? "閉じる" : "＋ 追加"}
        </button>
      </header>

      {/* 手動追加フォーム（トグル） */}
      {showForm && (
        <form onSubmit={handleAdd} className="card mt-4 animate-slide-up space-y-3">
          <div>
            <label className="field-label">食材名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: キャベツ"
              className="field"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="field-label">数量</label>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="field"
              />
            </div>
            <div className="flex-1">
              <label className="field-label">単位</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="個 / g / ml"
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="field-label">カテゴリ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategory)}
              className="field"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">消費期限</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="field"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !expiryDate}
            className="btn-primary w-full"
          >
            食材を追加
          </button>
        </form>
      )}

      {/* 食材一覧 */}
      {sorted.length === 0 ? (
        <div className="mt-8 rounded-3xl border-2 border-dashed border-ink/15 bg-white/50 py-12 text-center">
          <p className="text-4xl" aria-hidden>
            🧊
          </p>
          <p className="mt-2 text-sm font-semibold text-ink-soft">冷蔵庫は空です</p>
          <p className="mt-1 text-xs text-ink-soft/70">
            「＋追加」かレシート読取で食材を入れよう
          </p>
          <Link href="/shop" className="btn-ghost mt-4 inline-flex">
            🛒 390円で補充する
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {sorted.map((item) => {
            const status = expiryStatus(item.expiryDate);
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3.5 shadow-card"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream text-xl"
                  aria-hidden
                >
                  {CATEGORY_ICON[item.category]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-black text-ink">
                      {item.name}
                    </span>
                    <span className={`chip ${statusClasses(status)}`}>
                      {statusLabel(item.expiryDate)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {item.quantity}
                    {item.unit} ・ 期限 {item.expiryDate}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  {status === "expired" ? (
                    <button
                      type="button"
                      onClick={() => handleDiscard(item)}
                      aria-label={`${item.name}を処分`}
                      className="rounded-xl bg-urgent px-3 py-1 text-xs font-bold text-white hover:opacity-90"
                    >
                      処分
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUse(item)}
                      aria-label={`${item.name}を使った`}
                      className="rounded-xl bg-brand px-3 py-1 text-xs font-bold text-white hover:bg-brand-dark"
                    >
                      使った
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    aria-label={`${item.name}を削除`}
                    className="rounded-xl border border-ink/10 px-3 py-1 text-xs font-bold text-ink-soft hover:bg-cream"
                  >
                    削除
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
