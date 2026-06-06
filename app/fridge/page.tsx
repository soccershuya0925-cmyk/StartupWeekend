"use client";

// 担当: エンジニアB（冷蔵庫管理 /fridge）
// 食材の在庫一覧（期限が近い順・色分け）と手動の追加・削除。
import { useEffect, useState } from "react";
import {
  getFridge,
  addFoodItem,
  removeFoodItem,
  genId,
  getProgress,
  saveProgress,
} from "@/lib/storage";
import { expiryStatus, statusClasses, statusLabel, sortByExpiry } from "@/lib/expiry";
import { applyXP, XP_REWARDS } from "@/lib/xp";
import { logEcoAction, tryAwardZeroLossWeek } from "@/lib/achievements";
import type { FoodItem, FoodCategory } from "@/types";

// カテゴリのセレクト用ラベル（型 FoodCategory に厳密に対応）
const CATEGORY_OPTIONS: { value: FoodCategory; label: string }[] = [
  { value: "vegetable", label: "野菜" },
  { value: "meat", label: "肉・魚" },
  { value: "dairy", label: "乳製品・卵" },
  { value: "seasoning", label: "調味料" },
  { value: "other", label: "その他" },
];

export default function FridgePage() {
  const [items, setItems] = useState<FoodItem[]>([]);

  // フォーム入力 state
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("個");
  const [category, setCategory] = useState<FoodCategory>("vegetable");
  const [expiryDate, setExpiryDate] = useState("");

  // 「使い切り」XP獲得時の一時メッセージ
  const [toast, setToast] = useState<string | null>(null);

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
  }

  function handleRemove(id: string) {
    setItems(removeFoodItem(id));
  }

  // 「使った」: 期限内に使い切れたら +100XP ボーナス（機能④の使い切りボーナス）
  function handleUse(item: FoodItem) {
    const inTime = expiryStatus(item.expiryDate) !== "expired";
    const next = removeFoodItem(item.id);
    setItems(next);
    if (inTime) {
      saveProgress(applyXP(getProgress(), XP_REWARDS.useBeforeExpiry));
      // ロス削減アクションとして記録 → ロスゼロ週間の判定
      logEcoAction();
      const awarded = tryAwardZeroLossWeek(next);
      if (awarded) {
        showToast(
          `🏆 ロスゼロ週間 達成！ +${XP_REWARDS.zeroLossWeek} XP の特別ボーナス！`
        );
      } else {
        showToast(`期限内に使い切った！ +${XP_REWARDS.useBeforeExpiry} XP 🎉`);
      }
    } else {
      showToast(`${item.name}を片付けました`);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  return (
    <main className="px-4 py-6">
      <h1 className="text-xl font-bold text-slate-800">冷蔵庫</h1>
      <p className="mt-1 text-sm text-slate-500">
        消費期限が近い食材から順に表示しています。期限内に「使った」で +
        {XP_REWARDS.useBeforeExpiry} XP！
      </p>

      {/* 使い切りXPのトースト */}
      {toast && (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* 手動追加フォーム */}
      <form
        onSubmit={handleAdd}
        className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-600">食材名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: キャベツ"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600">数量</label>
            <input
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600">単位</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="個 / g / ml"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600">カテゴリ</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FoodCategory)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600">消費期限</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !expiryDate}
          className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          食材を追加
        </button>
      </form>

      {/* 食材一覧 */}
      {sorted.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-400">
          冷蔵庫は空です
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {sorted.map((item) => {
            const status = expiryStatus(item.expiryDate);
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-slate-800">
                      {item.name}
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClasses(
                        status
                      )}`}
                    >
                      {statusLabel(item.expiryDate)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.quantity}
                    {item.unit} ・ 期限 {item.expiryDate}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleUse(item)}
                    aria-label={`${item.name}を使った`}
                    className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark"
                  >
                    使った
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    aria-label={`${item.name}を削除`}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
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
