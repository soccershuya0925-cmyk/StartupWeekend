"use client";

import { useEffect, useRef, useState } from "react";
import {
  getFridge,
  saveFridge,
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
import { estimatedYen, computeLossStats, newZeroLossWeeks } from "@/lib/loss";
import Toast from "@/components/Toast";
import LevelUpCelebration from "@/components/LevelUpCelebration";
import type { FoodItem, FoodCategory, ReceiptItem } from "@/types";

// ============================================================
// 定数・ユーティリティ
// ============================================================

const CATEGORY_OPTIONS: { value: FoodCategory; label: string; icon: string }[] = [
  { value: "vegetable", label: "野菜", icon: "🥬" },
  { value: "meat",      label: "肉・魚", icon: "🍖" },
  { value: "dairy",     label: "乳製品・卵", icon: "🥚" },
  { value: "seasoning", label: "調味料", icon: "🧂" },
  { value: "other",     label: "その他", icon: "🍱" },
];
const CATEGORY_ICON: Record<FoodCategory, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((c) => [c.value, c.icon])
) as Record<FoodCategory, string>;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function dateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ============================================================
// 手打ちフォームパネル
// ============================================================

interface ManualFormProps {
  onAdd: (item: FoodItem) => void;
  onClose: () => void;
}

function ManualForm({ onAdd, onClose }: ManualFormProps) {
  const [name, setName]         = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit]         = useState("個");
  const [category, setCategory] = useState<FoodCategory>("vegetable");
  const [expiry, setExpiry]     = useState(dateFromNow(3));

  // よく使う食材のクイック選択
  const QUICK: { name: string; unit: string; cat: FoodCategory; days: number }[] = [
    { name: "キャベツ",   unit: "個",    cat: "vegetable", days: 5  },
    { name: "玉ねぎ",     unit: "個",    cat: "vegetable", days: 14 },
    { name: "にんじん",   unit: "本",    cat: "vegetable", days: 14 },
    { name: "卵",         unit: "パック",cat: "dairy",     days: 14 },
    { name: "豚こま肉",   unit: "パック",cat: "meat",      days: 2  },
    { name: "鶏もも肉",   unit: "パック",cat: "meat",      days: 2  },
    { name: "豆腐",       unit: "丁",    cat: "other",     days: 5  },
    { name: "牛乳",       unit: "本",    cat: "dairy",     days: 7  },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !expiry) return;
    onAdd({
      id: genId(),
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit: unit.trim() || "個",
      expiryDate: expiry,
      category,
      addedAt: new Date().toISOString(),
    });
    setName("");
    setQuantity("1");
    setExpiry(dateFromNow(3));
  }

  return (
    <div className="mt-3 animate-slide-up rounded-3xl border border-black/5 bg-white p-4 shadow-card">
      {/* クイック追加 */}
      <p className="mb-2 text-xs font-bold text-ink-soft">よく使う食材</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q.name}
            type="button"
            onClick={() => {
              setName(q.name);
              setUnit(q.unit);
              setCategory(q.cat);
              setExpiry(dateFromNow(q.days));
            }}
            className="rounded-full border border-brand/20 bg-brand-light px-3 py-1 text-xs font-bold text-brand"
          >
            {q.name}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 食材名 */}
        <div>
          <label className="field-label">食材名 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: トマト"
            className="field"
            autoFocus
          />
        </div>

        {/* 数量・単位・カテゴリ */}
        <div className="grid grid-cols-3 gap-2">
          <div>
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
          <div>
            <label className="field-label">単位</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="個 / g"
              className="field"
            />
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
        </div>

        {/* 消費期限 */}
        <div>
          <label className="field-label">消費期限 *</label>
          <input
            type="date"
            value={expiry}
            min={todayStr()}
            onChange={(e) => setExpiry(e.target.value)}
            className="field"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!name.trim() || !expiry}
            className="btn-primary flex-1"
          >
            ＋ 追加
          </button>
          <button type="button" onClick={onClose} className="btn-ghost px-4">
            閉じる
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// レシートスキャンパネル
// ============================================================

interface DraftItem extends ReceiptItem {
  expiryDate: string;
}

interface ReceiptPanelProps {
  onConfirm: (drafts: DraftItem[]) => void;
  onClose: () => void;
}

function ReceiptPanel({ onConfirm, onClose }: ReceiptPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [isMock, setIsMock]     = useState(false);
  const [drafts, setDrafts]     = useState<DraftItem[] | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setDrafts(null);
    setIsMock(false);
    setLoading(true);

    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.onerror = () => rej(new Error("読み込み失敗"));
        reader.readAsDataURL(file);
      });
      setPreview(dataUrl);

      const resp = await fetch("/api/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error ?? "解析失敗");

      const items: ReceiptItem[] = Array.isArray(data?.items) ? data.items : [];
      setIsMock(data?.mock === true);

      if (items.length === 0) {
        setError("食材を読み取れませんでした。別の画像をお試しください。");
        return;
      }
      setDrafts(items.map((i) => ({ ...i, expiryDate: dateFromNow(3) })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  function updateExpiry(idx: number, val: string) {
    setDrafts((prev) => prev?.map((d, i) => (i === idx ? { ...d, expiryDate: val } : d)) ?? null);
  }
  function updateName(idx: number, val: string) {
    setDrafts((prev) => prev?.map((d, i) => (i === idx ? { ...d, name: val } : d)) ?? null);
  }
  function removeDraft(idx: number) {
    setDrafts((prev) => prev?.filter((_, i) => i !== idx) ?? null);
  }

  function reset() {
    setPreview(null);
    setDrafts(null);
    setError(null);
    setIsMock(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="mt-3 animate-slide-up rounded-3xl border border-black/5 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-black text-ink">📷 レシートで一括追加</p>
        <button type="button" onClick={onClose} className="text-xs font-bold text-ink-soft">
          閉じる
        </button>
      </div>

      {/* 撮影ボタン */}
      {!drafts && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            disabled={loading}
            className="hidden"
            id="receipt-scan-input"
          />
          <label
            htmlFor="receipt-scan-input"
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/15 bg-cream py-8 text-center font-bold text-ink-soft transition hover:border-brand hover:text-brand ${loading ? "pointer-events-none opacity-60" : ""}`}
          >
            <span className="text-4xl">📷</span>
            <span className="mt-2 text-sm">レシートを撮影 / 選択</span>
            <span className="mt-1 text-xs font-normal">レジ袋の中でOK</span>
          </label>

          {/* 画像プレビュー */}
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="レシート" className="mt-3 max-h-40 w-full rounded-2xl object-contain" />
          )}

          {/* ローディング */}
          {loading && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-cream p-3 text-sm text-ink-soft">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-brand" />
              AIが解析中…
            </div>
          )}

          {isMock && (
            <div className="mt-3 rounded-xl border border-warn/30 bg-warn/10 p-2.5 text-xs font-semibold text-warn">
              デモモード（APIキー未設定）— サンプルデータを表示しています
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-xl border border-urgent/30 bg-urgent/10 p-2.5 text-xs font-semibold text-urgent">
              {error}
            </div>
          )}
        </>
      )}

      {/* 解析結果の編集 */}
      {drafts && drafts.length > 0 && (
        <>
          <p className="mb-2 text-xs font-bold text-ink-soft">
            読み取り結果 {drafts.length} 件 — 名前・期限を確認してから追加
          </p>
          {isMock && (
            <div className="mb-2 rounded-xl border border-warn/30 bg-warn/10 p-2 text-xs text-warn">
              デモモード（サンプル）
            </div>
          )}
          <ul className="space-y-2">
            {drafts.map((d, i) => (
              <li key={i} className="rounded-2xl border border-black/5 bg-cream p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CATEGORY_ICON[d.category]}</span>
                  <input
                    type="text"
                    value={d.name}
                    onChange={(e) => updateName(i, e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-2 py-1.5 text-sm font-bold text-ink outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => removeDraft(i)}
                    className="shrink-0 text-xs font-bold text-ink-soft hover:text-urgent"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-ink-soft">{d.quantity}{d.unit}</span>
                  {d.price != null && <span className="text-xs text-ink-soft">¥{d.price}</span>}
                  <span className="ml-auto text-xs font-semibold text-ink-soft">期限</span>
                  <input
                    type="date"
                    value={d.expiryDate}
                    onChange={(e) => updateExpiry(i, e.target.value)}
                    className="rounded-xl border border-black/10 bg-white px-2 py-1 text-xs text-ink outline-none focus:border-brand"
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onConfirm(drafts)}
              className="btn-primary flex-1"
            >
              冷蔵庫に追加（{drafts.length}品）
            </button>
            <button type="button" onClick={reset} className="btn-ghost px-4 text-sm">
              やり直し
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// インライン編集行
// ============================================================

interface ItemRowProps {
  item: FoodItem;
  onUse: (item: FoodItem) => void;
  onDiscard: (item: FoodItem) => void;
  onRemove: (id: string) => void;
  onChangeQty: (id: string, delta: number) => void;
  onChangeExpiry: (id: string, date: string) => void;
}

function ItemRow({ item, onUse, onDiscard, onRemove, onChangeQty, onChangeExpiry }: ItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const status = expiryStatus(item.expiryDate);

  return (
    <li className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card">
      {/* メイン行 */}
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream text-xl"
          aria-label="詳細を開く"
        >
          {CATEGORY_ICON[item.category]}
        </button>

        <div
          className="min-w-0 flex-1 cursor-pointer"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <span className="truncate font-black text-ink">{item.name}</span>
            <span className={`chip shrink-0 ${statusClasses(status)}`}>
              {statusLabel(item.expiryDate)}
            </span>
          </div>
          {/* 数量インライン ±ボタン */}
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChangeQty(item.id, -1); }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-ink-soft hover:bg-brand-light hover:text-brand"
            >
              −
            </button>
            <span className="min-w-[2rem] text-center text-sm font-bold text-ink">
              {item.quantity}{item.unit}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChangeQty(item.id, +1); }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-ink-soft hover:bg-brand-light hover:text-brand"
            >
              ＋
            </button>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex shrink-0 flex-col gap-1.5">
          {status === "expired" ? (
            <button
              type="button"
              onClick={() => onDiscard(item)}
              className="rounded-xl bg-urgent px-3 py-2 text-xs font-bold text-white"
            >
              処分
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onUse(item)}
              className="rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white"
            >
              使った✓
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="rounded-xl border border-ink/10 px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-cream"
          >
            削除
          </button>
        </div>
      </div>

      {/* 展開時の詳細編集 */}
      {expanded && (
        <div className="border-t border-black/5 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-ink-soft">期限を変更:</span>
            <input
              type="date"
              defaultValue={item.expiryDate}
              onChange={(e) => onChangeExpiry(item.id, e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-brand"
            />
            <span className="text-xs text-ink-soft">
              追加日: {new Date(item.addedAt).toLocaleDateString("ja-JP")}
            </span>
          </div>
        </div>
      )}
    </li>
  );
}

// ============================================================
// ページ本体
// ============================================================

type AddMode = "manual" | "receipt" | null;

export default function FridgePage() {
  const [items, setItems]     = useState<FoodItem[]>([]);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [filter, setFilter]   = useState<FoodCategory | "all">("all");
  const [search, setSearch]   = useState("");
  const [toast, setToast]     = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number; newStage: boolean } | null>(null);

  useEffect(() => { setItems(getFridge()); }, []);

  // フィルター・検索適用
  const sorted = sortByExpiry(items);
  const visible = sorted.filter((it) => {
    const matchCat = filter === "all" || it.category === filter;
    const matchSearch = !search || it.name.includes(search);
    return matchCat && matchSearch;
  });

  // ステータス集計（バッジ用）
  const urgentCount  = items.filter((i) => expiryStatus(i.expiryDate) === "urgent").length;
  const expiredCount = items.filter((i) => expiryStatus(i.expiryDate) === "expired").length;

  // ---- 手打ち追加 ----
  function handleManualAdd(item: FoodItem) {
    setItems(addFoodItem(item));
    setToast(`${item.name}を追加しました`);
  }

  // ---- レシート追加 ----
  function handleReceiptConfirm(drafts: { name: string; quantity: number; unit: string; category: FoodCategory; price?: number; expiryDate: string }[]) {
    const before = getProgress();
    for (const d of drafts) {
      addFoodItem({
        id: genId(),
        name: d.name,
        quantity: d.quantity,
        unit: d.unit,
        expiryDate: d.expiryDate,
        category: d.category,
        addedAt: new Date().toISOString(),
        price: d.price,
      });
      saveProgress(applyXP(getProgress(), XP_REWARDS.receipt));
    }
    setItems(getFridge());
    setAddMode(null);
    setToast(`${drafts.length}品を冷蔵庫に追加しました (+${XP_REWARDS.receipt * drafts.length} XP) 🎉`);
    const after = getProgress();
    if (after.level > before.level) {
      setLevelUp({ level: after.level, newStage: stageFromLevel(after.level).stage !== stageFromLevel(before.level).stage });
    }
  }

  // ---- 使った ----
  function handleUse(item: FoodItem) {
    setItems(removeFoodItem(item.id));
    const before = getProgress();
    const events = addLossEvent({ id: genId(), type: "saved", itemName: item.name, estimatedYen: estimatedYen(item), at: new Date().toISOString() });
    let after = applyXP(before, XP_REWARDS.useBeforeExpiry);
    const stats = computeLossStats(events);
    const award = newZeroLossWeeks(stats.zeroLossWeeks, getZeroLossWeeks());
    let weekBonus = false;
    if (award > 0) {
      after = applyXP(after, XP_REWARDS.zeroLossWeek * award);
      setZeroLossWeeks(stats.zeroLossWeeks);
      weekBonus = true;
    }
    saveProgress(after);
    setToast(weekBonus ? `ロスゼロ週間達成！ +${XP_REWARDS.zeroLossWeek} XP 🔥` : `期限内に使い切った！ +${XP_REWARDS.useBeforeExpiry} XP 🎉`);
    if (after.level > before.level) setLevelUp({ level: after.level, newStage: stageFromLevel(after.level).stage !== stageFromLevel(before.level).stage });
  }

  // ---- 処分 ----
  function handleDiscard(item: FoodItem) {
    setItems(removeFoodItem(item.id));
    addLossEvent({ id: genId(), type: "wasted", itemName: item.name, estimatedYen: estimatedYen(item), at: new Date().toISOString() });
    setToast(`${item.name}を処分しました。次は早めに使おう…`);
  }

  // ---- 削除 ----
  function handleRemove(id: string) {
    setItems(removeFoodItem(id));
  }

  // ---- 数量増減 ----
  function handleChangeQty(id: string, delta: number) {
    const next = items.map((it) => {
      if (it.id !== id) return it;
      const q = Math.max(0, it.quantity + delta);
      return { ...it, quantity: q };
    });
    saveFridge(next);
    setItems(next);
  }

  // ---- 期限変更 ----
  function handleChangeExpiry(id: string, date: string) {
    if (!date) return;
    const next = items.map((it) => (it.id === id ? { ...it, expiryDate: date } : it));
    saveFridge(next);
    setItems(next);
  }

  // addMode トグル（同じボタン再押しで閉じる）
  function toggleMode(mode: AddMode) {
    setAddMode((cur) => (cur === mode ? null : mode));
  }

  return (
    <main className="page">
      <Toast message={toast} onDone={() => setToast(null)} />
      <LevelUpCelebration level={levelUp?.level ?? null} newStage={levelUp?.newStage} onClose={() => setLevelUp(null)} />

      {/* ヘッダー */}
      <header className="mb-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-accent">INVENTORY</p>
            <h1 className="page-title">🧊 冷蔵庫</h1>
          </div>
          {/* ステータスバッジ */}
          <div className="flex gap-2 pb-1">
            {expiredCount > 0 && (
              <span className="rounded-full bg-urgent/10 px-2.5 py-1 text-xs font-black text-urgent">
                期限切れ {expiredCount}品
              </span>
            )}
            {urgentCount > 0 && (
              <span className="rounded-full bg-warn/10 px-2.5 py-1 text-xs font-black text-warn">
                期限近い {urgentCount}品
              </span>
            )}
          </div>
        </div>

        {/* 追加モード選択ボタン */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => toggleMode("manual")}
            className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-black transition-all ${
              addMode === "manual"
                ? "border-brand bg-brand text-white shadow-glow"
                : "border-brand/30 bg-brand-light text-brand"
            }`}
          >
            ✏️ 手打ちで追加
          </button>
          <button
            type="button"
            onClick={() => toggleMode("receipt")}
            className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-black transition-all ${
              addMode === "receipt"
                ? "border-brand bg-brand text-white shadow-glow"
                : "border-ink/15 bg-white text-ink"
            }`}
          >
            📷 レシートで追加
          </button>
        </div>

        {/* 追加パネル */}
        {addMode === "manual" && (
          <ManualForm onAdd={(item) => { handleManualAdd(item); }} onClose={() => setAddMode(null)} />
        )}
        {addMode === "receipt" && (
          <ReceiptPanel onConfirm={handleReceiptConfirm} onClose={() => setAddMode(null)} />
        )}
      </header>

      {/* 検索・フィルター */}
      {items.length > 0 && (
        <div className="mb-3 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 食材を検索…"
            className="field"
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[{ value: "all", label: "すべて", icon: "🧊" }, ...CATEGORY_OPTIONS.map(c => ({ value: c.value, label: c.label, icon: c.icon }))].map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setFilter(c.value as FoodCategory | "all")}
                className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  filter === c.value
                    ? "bg-brand text-white"
                    : "bg-white border border-black/10 text-ink-soft"
                }`}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 在庫一覧 */}
      {visible.length === 0 && items.length === 0 ? (
        <div className="mt-6 rounded-3xl border-2 border-dashed border-ink/15 bg-white/50 py-12 text-center">
          <p className="text-5xl">🧊</p>
          <p className="mt-3 font-black text-ink">冷蔵庫は空です</p>
          <p className="mt-1 text-sm text-ink-soft">
            「手打ちで追加」か「レシートで追加」で食材を入れましょう
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-cream p-6 text-center text-sm text-ink-soft">
          検索・フィルターに一致する食材がありません
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs font-bold text-ink-soft">
            {visible.length}品 （期限が近い順）
          </p>
          <ul className="space-y-2.5">
            {visible.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onUse={handleUse}
                onDiscard={handleDiscard}
                onRemove={handleRemove}
                onChangeQty={handleChangeQty}
                onChangeExpiry={handleChangeExpiry}
              />
            ))}
          </ul>
        </>
      )}

      <div className="h-4" />
    </main>
  );
}
