"use client";

// 注文フロー（PR #15 を feat/full-mvp 向けに移植）
//   Step1: いつ食べる？（食習慣管理）
//   Step2: 受け取り方法（ロッカー¥390 / 配達+¥260）＋ 受取時間（何限終わり）
//   Step3: 完了（QRコード＋受取コード＋ロッカー解錠「ガチャッ！」＋XP）

import { useState } from "react";
import { addPlan, genId, getProgress, saveProgress, recordEcoAction } from "@/lib/storage";
import { applyXP, XP_REWARDS } from "@/lib/xp";
import type { Product } from "@/types";

type Step = "eat" | "pickup" | "done";

interface Pickup {
  id: string;
  icon: string;
  title: string;
  sub: string;
  extra: number;
  badge: string;
  best: boolean;
  isLocker: boolean;
}

const PICKUPS: Pickup[] = [
  { id: "locker-circle", icon: "🏫", title: "大学サークル棟の冷凍ロッカー", sub: "徒歩2分・24時間受取OK", extra: 0, badge: "お得！", best: true, isLocker: true },
  { id: "locker-apt",    icon: "🏢", title: "学生マンション1Fロッカー",    sub: "最寄り駅チカ・徒歩5分",   extra: 0, badge: "お得！", best: true, isLocker: true },
  { id: "delivery",      icon: "🛵", title: "アパートへ個別配送",          sub: "玄関先まで・時間指定OK",   extra: 260, badge: "通常", best: false, isLocker: false },
];

const TIMESLOTS = [
  { id: "p2", label: "2限終わり", time: "12:10" },
  { id: "p3", label: "3限終わり", time: "14:40" },
  { id: "p4", label: "4限終わり", time: "16:20" },
  { id: "p5", label: "5限終わり", time: "18:00" },
];

function dateAfter(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ダミーQR生成（seed で安定した見た目）
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function QrCode({ seed }: { seed: number }) {
  const N = 25, cell = 8, size = N * cell;
  const rnd = mulberry32(seed || 7);
  const grid: number[][] = Array.from({ length: N }, () => Array(N).fill(0));

  const finder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++) {
        const edge = i === 0 || i === 6 || j === 0 || j === 6;
        const inner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        grid[r + i][c + j] = edge || inner ? 1 : 0;
      }
  };
  finder(0, 0); finder(0, N - 7); finder(N - 7, 0);

  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const inF = (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);
      if (!inF) grid[r][c] = rnd() > 0.52 ? 1 : 0;
    }

  const rects: React.ReactElement[] = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (grid[r][c])
        rects.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} />);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-40 w-40" shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#ffffff" />
      <g fill="#1f2937">{rects}</g>
    </svg>
  );
}

interface Props {
  product: Product;
  onClose: () => void;
  onPlaced?: (info: { total: number; xp: number }) => void;
}

export default function OrderFlow({ product, onClose, onPlaced }: Props) {
  const [step, setStep] = useState<Step>("eat");
  const [eatDate, setEatDate] = useState(dateAfter(1));
  const [pickupId, setPickupId] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [order, setOrder] = useState<{ code: string; no: string; seed: number } | null>(null);
  const [opened, setOpened] = useState(false);

  const pickup = PICKUPS.find((p) => p.id === pickupId) ?? null;
  const slot = TIMESLOTS.find((s) => s.id === slotId) ?? null;
  const total = product.price + (pickup?.extra ?? 0);

  function place() {
    if (!pickup || !slot) return;
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const no = "SW-" + String(Math.floor(100 + Math.random() * 900));
    addPlan({ id: genId(), productName: product.name, emoji: product.emoji, eatDate, done: false, orderedAt: new Date().toISOString() });
    saveProgress(applyXP(getProgress(), XP_REWARDS.planMeal));
    recordEcoAction(new Date().toISOString().slice(0, 10));
    setOrder({ code, no, seed: parseInt(code, 10) });
    setStep("done");
    onPlaced?.({ total, xp: XP_REWARDS.planMeal });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 animate-slide-up">

        {/* 商品ヘッダー */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">{product.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-black text-ink">{product.name}</p>
            <p className="text-sm font-bold text-brand">
              ¥{total}
              {pickup?.extra ? `（¥${product.price}＋配達¥${pickup.extra}）` : "（都度払い）"}
            </p>
          </div>
          <span className="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-black text-ink-soft">
            {step === "eat" ? "1 / 2" : step === "pickup" ? "2 / 2" : "完了"}
          </span>
        </div>

        {/* ---- Step 1: いつ食べる？ ---- */}
        {step === "eat" && (
          <>
            <label className="field-label mt-4 block">いつ食べる？（食べる日を決めて無駄なく）</label>
            <input
              type="date"
              value={eatDate}
              onChange={(e) => setEatDate(e.target.value)}
              className="field mt-1"
            />
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={onClose} className="btn-outline flex-1">やめる</button>
              <button type="button" onClick={() => setStep("pickup")} className="btn-primary flex-1">
                受け取り方法へ →
              </button>
            </div>
          </>
        )}

        {/* ---- Step 2: 受け取り方法＋時間 ---- */}
        {step === "pickup" && (
          <>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-black text-ink">📍 受け取り方法</span>
              <span className="rounded-full bg-gradient-to-br from-brand to-brand-dark px-2 py-0.5 text-[10px] font-black text-white">
                ピザクック方式
              </span>
            </div>
            <ul className="mt-2 space-y-2">
              {PICKUPS.map((p) => {
                const on = p.id === pickupId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setPickupId(p.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all ${
                        on ? "border-brand bg-brand-light" : "border-black/10 bg-white"
                      }`}
                    >
                      <span className="text-2xl">{p.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-ink">{p.title}</p>
                        <p className="text-xs text-ink-soft">{p.sub}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`block text-[10px] font-black ${p.best ? "text-brand" : "text-ink-soft"}`}>{p.badge}</span>
                        <span className="text-sm font-black text-accent">
                          {p.extra ? `+¥${p.extra}` : `¥${product.price}`}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-black text-ink">🕐 受取時間</span>
              <span className="rounded-full bg-gradient-to-br from-accent to-accent-dark px-2 py-0.5 text-[10px] font-black text-white">
                何限終わり？
              </span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {TIMESLOTS.map((s) => {
                const on = s.id === slotId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSlotId(s.id)}
                    className={`rounded-2xl border-2 py-2 text-center transition-all ${
                      on ? "border-brand bg-brand-light" : "border-black/10 bg-white"
                    }`}
                  >
                    <span className="block text-xs font-black text-ink">{s.label}</span>
                    <span className="block text-[10px] text-ink-soft">{s.time}〜</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setStep("eat")} className="btn-outline flex-1">← 戻る</button>
              <button
                type="button"
                onClick={place}
                disabled={!pickup || !slot}
                className="btn-primary flex-1 disabled:opacity-40"
              >
                注文を確定（¥{total}）
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-soft/60">※ デモのため実際の決済は行われません</p>
          </>
        )}

        {/* ---- Step 3: 完了 ---- */}
        {step === "done" && order && (
          <div className="mt-4 text-center">
            <div className="text-5xl animate-pop-in">🎉</div>
            <p className="mt-1 text-lg font-black text-ink">注文が完了しました！</p>
            <p className="text-sm font-bold text-brand">
              {pickup?.isLocker ? "学校帰りにロッカーへGO！" : "玄関先までお届けします！"}{" "}
              +{XP_REWARDS.planMeal} XP
            </p>

            <div className="mt-4 space-y-1.5 rounded-2xl bg-cream p-4 text-left text-xs font-bold text-ink-soft">
              {[
                ["商品",     `${product.emoji} ${product.name}`],
                ["注文番号", `#${order.no}`],
                ["受取場所", `${pickup?.icon} ${pickup?.title}`],
                ["受取予定", `本日 ${slot?.label}（${slot?.time}）以降`],
                ["受取コード", order.code],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span>{label}</span>
                  <span className={`text-right font-black text-ink ${label === "受取コード" ? "font-mono tracking-widest text-brand" : ""}`}>{val}</span>
                </div>
              ))}
            </div>

            {/* QR */}
            <div className="mt-4">
              <p className="text-xs font-black text-ink-soft">📷 受け取りQRコード</p>
              <div className="mx-auto mt-2 w-fit rounded-2xl bg-white p-2 shadow-card">
                <QrCode seed={order.seed} />
              </div>
            </div>

            {/* ロッカー解錠 or 配送 */}
            {pickup?.isLocker ? (
              <button
                type="button"
                onClick={() => setOpened(true)}
                disabled={opened}
                className={`mt-4 w-full rounded-2xl py-4 text-base font-black text-white transition-all active:scale-95 ${
                  opened
                    ? "bg-gradient-to-br from-brand to-brand-dark shadow-glow"
                    : "bg-ink hover:brightness-110"
                }`}
              >
                {opened ? "🔓 ガチャッ！開きました 🎉" : "🔒 ロッカーを開ける"}
              </button>
            ) : (
              <div className="mt-4 rounded-2xl bg-cream py-3 text-sm font-black text-ink-soft">
                🛵 本日 {slot?.time}〜 玄関先までお届け予定
              </div>
            )}

            <div className="mt-4 rounded-2xl bg-brand-light p-3 text-sm font-black text-brand-dark">
              🌱 この一食で食品ロスを約 480g 削減（¥620 お得）
            </div>

            <button type="button" onClick={onClose} className="btn-outline mt-4 w-full">閉じる</button>
          </div>
        )}
      </div>
    </div>
  );
}
