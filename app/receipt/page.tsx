"use client";

// 担当: エンジニアD（レシート読み取り）
// 画像選択 → POST /api/receipt で AI 解析 → 冷蔵庫に「自動登録」+ XP。
// 期限はカテゴリ別に自動推定。誤読対策として、追加直後に取り消し(Undo)でき、
// /fridge で個別に編集・削除もできる。

import { useRef, useState } from "react";
import Link from "next/link";
import {
  addFoodItem,
  removeFoodItem,
  getProgress,
  saveProgress,
  genId,
} from "@/lib/storage";
import { applyXP, XP_REWARDS } from "@/lib/xp";
import type { ReceiptItem, FoodItem } from "@/types";

/** 今日から days 日後の日付を YYYY-MM-DD で返す */
function dateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** カテゴリ別の消費期限の目安（日数）。レシートに期限は無いので推定する */
function defaultShelfLifeDays(category: ReceiptItem["category"]): number {
  switch (category) {
    case "meat":
      return 3; // 肉・魚は短め
    case "vegetable":
      return 5;
    case "dairy":
      return 7;
    case "seasoning":
      return 60; // 調味料は長持ち
    default:
      return 5;
  }
}

export default function ReceiptPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null); // 選択画像の data URL
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  // 直近に自動追加した食材（Undo 用）
  const [addedItems, setAddedItems] = useState<FoodItem[] | null>(null);

  /** File を base64 data URL に変換 */
  function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      reader.readAsDataURL(file);
    });
  }

  /** 画像が選ばれたら data URL に変換 → 解析 → そのまま冷蔵庫へ自動登録 */
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setAddedItems(null);
    setIsMock(false);
    setLoading(true);

    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(dataUrl);

      const res = await fetch("/api/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "解析に失敗しました");
      }

      const items: ReceiptItem[] = Array.isArray(data?.items) ? data.items : [];
      setIsMock(data?.mock === true);

      if (items.length === 0) {
        setError("レシートから食材を読み取れませんでした。別の画像をお試しください。");
        return;
      }

      // === 自動登録 === 解析結果をそのまま冷蔵庫へ（期限はカテゴリ別に自動推定）
      const added: FoodItem[] = items.map((item) => ({
        id: genId(),
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        expiryDate: dateFromNow(defaultShelfLifeDays(item.category)),
        category: item.category,
        addedAt: new Date().toISOString(),
      }));
      added.forEach((food) => addFoodItem(food));
      saveProgress(applyXP(getProgress(), XP_REWARDS.receipt * added.length));
      setAddedItems(added);
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  /** 取り消し：直近で自動追加した食材を冷蔵庫から取り除き、XP も戻す */
  function handleUndo() {
    if (!addedItems) return;
    addedItems.forEach((f) => removeFoodItem(f.id));
    saveProgress(
      applyXP(getProgress(), -XP_REWARDS.receipt * addedItems.length)
    );
    handleReset();
  }

  /** やり直し：状態をリセットして再選択できるように */
  function handleReset() {
    setPreview(null);
    setAddedItems(null);
    setError(null);
    setIsMock(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <main className="px-4 py-6">
      <h1 className="text-xl font-bold text-slate-800">レシート読み取り 🧾</h1>
      <p className="mt-1 text-sm text-slate-500">
        レシートを撮影すると食材を自動で読み取り、そのまま冷蔵庫に登録します。
      </p>

      {/* 画像選択 */}
      <div className="mt-5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          disabled={loading}
          className="hidden"
          id="receipt-input"
        />
        <label
          htmlFor="receipt-input"
          className={`block cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-600 transition-colors hover:border-brand hover:text-brand ${
            loading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          📷 レシートを撮影・選択する
        </label>
      </div>

      {/* 画像プレビュー */}
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="選択したレシート"
          className="mt-4 max-h-60 w-full rounded-lg object-contain"
        />
      )}

      {/* ローディング */}
      {loading && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
          AIがレシートを解析しています…（数秒かかります）
        </div>
      )}

      {/* エラー */}
      {error && (
        <div className="mt-4 rounded-lg border border-urgent/30 bg-urgent/10 p-3 text-sm text-urgent">
          {error}
        </div>
      )}

      {/* デモモード表示 */}
      {isMock && addedItems && (
        <div className="mt-4 rounded-lg border border-warn/30 bg-warn/10 p-3 text-sm text-warn">
          デモモード（APIキー未設定）— サンプルの食材を登録しました。
        </div>
      )}

      {/* 自動登録の結果 */}
      {addedItems && addedItems.length > 0 && (
        <section className="mt-5">
          <div className="rounded-lg border border-brand/30 bg-brand/10 p-3 text-sm text-brand-dark">
            ✅ {addedItems.length} 件の食材を冷蔵庫に自動登録しました（+
            {XP_REWARDS.receipt * addedItems.length} XP）🎉
          </div>

          <ul className="mt-3 space-y-2">
            {addedItems.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
              >
                <span className="font-semibold text-slate-800">{f.name}</span>
                <span className="text-xs text-slate-500">
                  {f.quantity}
                  {f.unit} ・ 期限 {f.expiryDate}（推定）
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-2 text-xs text-slate-400">
            消費期限はカテゴリから推定した目安です。冷蔵庫で個別に調整できます。
          </p>

          <div className="mt-4 flex gap-3">
            <Link
              href="/fridge"
              className="flex-1 rounded-lg bg-brand px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              冷蔵庫で確認・編集する
            </Link>
            <button
              type="button"
              onClick={handleUndo}
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              取り消す
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
          >
            別のレシートを読み込む
          </button>
        </section>
      )}
    </main>
  );
}
