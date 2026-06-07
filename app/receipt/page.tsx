"use client";

// 担当: エンジニアD（レシート読み取り）
// docs/tasks/D-receipt.md に従って実装。
// 画像選択 → POST /api/receipt で AI 解析 → 期限を入力して冷蔵庫に追加 + XP。

import { useRef, useState } from "react";
import Link from "next/link";
import { addFoodItem, getProgress, saveProgress, genId } from "@/lib/storage";
import { applyXP, XP_REWARDS, stageFromLevel } from "@/lib/xp";
import LevelUpCelebration from "@/components/LevelUpCelebration";
import type { ReceiptItem, FoodItem } from "@/types";

/** 解析結果1行ぶんの編集状態（ReceiptItem + ユーザーが決めた消費期限） */
interface DraftItem extends ReceiptItem {
  expiryDate: string; // YYYY-MM-DD
}

/** 今日から days 日後の日付を YYYY-MM-DD で返す */
function dateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const CATEGORY_LABELS: Record<ReceiptItem["category"], string> = {
  vegetable: "野菜",
  meat: "肉・魚",
  dairy: "乳製品・卵",
  seasoning: "調味料",
  other: "その他",
};

export default function ReceiptPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null); // 選択画像の data URL
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [drafts, setDrafts] = useState<DraftItem[] | null>(null);
  const [addedCount, setAddedCount] = useState<number | null>(null); // 追加完了メッセージ用
  const [levelUp, setLevelUp] = useState<{ level: number; newStage: boolean } | null>(null);

  /** File を base64 data URL に変換 */
  function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      reader.readAsDataURL(file);
    });
  }

  /** 画像が選ばれたら data URL に変換して /api/receipt へ送る */
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 直前の結果をクリア
    setError(null);
    setDrafts(null);
    setAddedCount(null);
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

      // 解析結果に「デフォルト3日後」の消費期限を付けて編集可能にする
      setDrafts(
        items.map((item) => ({
          ...item,
          expiryDate: dateFromNow(3),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  /** 各行の消費期限を更新 */
  function updateExpiry(index: number, expiryDate: string) {
    setDrafts((prev) =>
      prev
        ? prev.map((d, i) => (i === index ? { ...d, expiryDate } : d))
        : prev
    );
  }

  /** プレビューの1行を取り除く（不要な食材を除外できる） */
  function removeDraft(index: number) {
    setDrafts((prev) =>
      prev ? prev.filter((_, i) => i !== index) : prev
    );
  }

  /** 確認 → 各食材を FoodItem に変換して冷蔵庫へ追加、登録ごとに XP 加算 */
  function handleConfirm() {
    if (!drafts || drafts.length === 0) return;

    const before = getProgress();
    for (const d of drafts) {
      const food: FoodItem = {
        id: genId(),
        name: d.name,
        quantity: d.quantity,
        unit: d.unit,
        expiryDate: d.expiryDate,
        category: d.category,
        addedAt: new Date().toISOString(),
        price: d.price, // 節約額の概算に使う
      };
      addFoodItem(food);
      saveProgress(applyXP(getProgress(), XP_REWARDS.receipt));
    }

    const after = getProgress();
    setAddedCount(drafts.length);
    setDrafts(null);
    setPreview(null);
    setIsMock(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (after.level > before.level) {
      setLevelUp({
        level: after.level,
        newStage:
          stageFromLevel(after.level).stage !== stageFromLevel(before.level).stage,
      });
    }
  }

  /** やり直し：状態をリセットして再選択できるように */
  function handleReset() {
    setPreview(null);
    setDrafts(null);
    setError(null);
    setIsMock(false);
    setAddedCount(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <main className="page">
      <LevelUpCelebration
        level={levelUp?.level ?? null}
        newStage={levelUp?.newStage}
        onClose={() => setLevelUp(null)}
      />

      <h1 className="page-title">🧾 レシート読み取り</h1>
      <p className="page-sub">
        レシートを撮影すると食材を自動で読み取り、冷蔵庫に追加できます。
      </p>

      {/* 追加完了メッセージ */}
      {addedCount !== null && (
        <div className="mt-4 animate-pop-in rounded-2xl border border-brand/20 bg-brand-light p-4 text-sm font-bold text-brand-dark">
          <p>
            {addedCount} 件の食材を冷蔵庫に追加しました（+
            {XP_REWARDS.receipt * addedCount} XP）🎉
          </p>
          <Link href="/fridge" className="btn-primary mt-3 w-full">
            🧊 冷蔵庫を見る
          </Link>
        </div>
      )}

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
          className={`block cursor-pointer rounded-3xl border-2 border-dashed border-ink/15 bg-white px-4 py-10 text-center text-sm font-bold text-ink-soft transition hover:border-brand hover:text-brand ${
            loading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <span className="block text-4xl" aria-hidden>
            📷
          </span>
          <span className="mt-2 block">レシートを撮影・選択する</span>
        </label>
      </div>

      {/* 画像プレビュー */}
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="選択したレシート"
          className="mt-4 max-h-60 w-full rounded-2xl object-contain"
        />
      )}

      {/* ローディング */}
      {loading && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-sm font-semibold text-ink-soft shadow-card">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-brand" />
          AIがレシートを解析しています…（数秒かかります）
        </div>
      )}

      {/* エラー */}
      {error && (
        <div className="mt-4 rounded-2xl border border-urgent/30 bg-urgent/10 p-3 text-sm font-semibold text-urgent">
          {error}
        </div>
      )}

      {/* デモモード表示 */}
      {isMock && drafts && (
        <div className="mt-4 rounded-2xl border border-warn/30 bg-warn/10 p-3 text-xs font-semibold text-warn">
          デモモード（APIキー未設定）— サンプルの食材を表示しています。
        </div>
      )}

      {/* プレビュー（解析結果の編集） */}
      {drafts && drafts.length > 0 && (
        <section className="mt-5">
          <h2 className="section-title">
            読み取った食材（{drafts.length} 件）
          </h2>
          <p className="mb-2 text-xs text-ink-soft">
            各食材の消費期限を入力してから追加してください（初期値は3日後）。
          </p>

          <ul className="space-y-2.5">
            {drafts.map((d, i) => (
              <li
                key={i}
                className="rounded-2xl border border-black/5 bg-white p-3.5 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-ink">{d.name}</p>
                    <p className="text-xs text-ink-soft">
                      {d.quantity}
                      {d.unit} ・ {CATEGORY_LABELS[d.category]}
                      {d.price != null ? ` ・ ¥${d.price}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDraft(i)}
                    className="text-xs font-bold text-ink-soft hover:text-urgent"
                    aria-label={`${d.name} を除外`}
                  >
                    除外
                  </button>
                </div>

                <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink-soft">
                  消費期限
                  <input
                    type="date"
                    value={d.expiryDate}
                    onChange={(e) => updateExpiry(i, e.target.value)}
                    className="rounded-lg border border-ink/10 px-2 py-1 text-sm text-ink"
                  />
                </label>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex gap-3">
            <button type="button" onClick={handleConfirm} className="btn-primary flex-1 py-3">
              冷蔵庫に追加（+{XP_REWARDS.receipt * drafts.length} XP）
            </button>
            <button type="button" onClick={handleReset} className="btn-outline py-3">
              やり直す
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
