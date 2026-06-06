"use client";

// ============================================================
// 注文フロー（折衷C + Vanilla版の「ピザクック方式」を統合）
//   Step1 いつ食べる？（食習慣管理）
//   Step2 受け取り方法（ロッカー¥390 / 配達+¥260）＋ 受取時間（何限終わり）
//   Step3 完了（QRコード＋受取コード＋ロッカー解錠「ガチャッ！」＋XP）
// ============================================================

import { useState, type ReactElement } from "react";
import {
  addPlan,
  genId,
  getProgress,
  saveProgress,
  recordEcoAction,
} from "@/lib/storage";
import { applyXP, XP_REWARDS } from "@/lib/xp";
import type { Product } from "@/types";

type Step = "eat" | "pickup" | "done";

interface Pickup {
  id: string;
  icon: string;
  title: string;
  sub: string;
  extra: number; // 追加料金（配達など）
  badge: string;
  best: boolean;
  isLocker: boolean;
}

const PICKUPS: Pickup[] = [
  { id: "locker-circle", icon: "🏫", title: "大学サークル棟の冷凍ロッカー", sub: "徒歩2分・24時間受取OK", extra: 0, badge: "お得！", best: true, isLocker: true },
  { id: "locker-apt", icon: "🏢", title: "学生マンション1Fロッカー", sub: "最寄り駅チカ・徒歩5分", extra: 0, badge: "お得！", best: true, isLocker: true },
  { id: "delivery", icon: "🛵", title: "アパートへ個別配送", sub: "玄関先まで・時間指定OK", extra: 260, badge: "通常", best: false, isLocker: false },
];

const TIMESLOTS = [
  { id: "p2", label: "2限終わり", time: "12:10" },
  { id: "p3", label: "3限終わり", time: "14:40" },
  { id: "p4", label: "4限終わり", time: "16:20" },
  { id: "p5", label: "5限終わり", time: "18:00" },
];

/** n 日後の YYYY-MM-DD */
function dateAfter(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// ---- ダミーQR（Vanilla版から移植：seedで安定生成） ----
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
  const N = 25;
  const cell = 8;
  const size = N * cell;
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
  finder(0, 0);
  finder(0, N - 7);
  finder(N - 7, 0);
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const inF = (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);
      if (inF) continue;
      grid[r][c] = rnd() > 0.52 ? 1 : 0;
    }
  const rects: ReactElement[] = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (grid[r][c])
        rects.push(
          <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} />
        );
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
  /** 注文確定時：親でトースト表示や一覧更新に使う */
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
    // 食べる予定（食習慣管理）に追加 ＋「予定を立てた」XP ＋ ロス削減アクション記録
    addPlan({
      id: genId(),
      productName: product.name,
      emoji: product.emoji,
      eatDate,
      done: false,
      orderedAt: new Date().toISOString(),
    });
    saveProgress(applyXP(getProgress(), XP_REWARDS.planMeal));
    recordEcoAction(new Date().toISOString().slice(0, 10));
    setOrder({ code, no, seed: parseInt(code, 10) });
    setStep("done");
    onPlaced?.({ total, xp: XP_REWARDS.planMeal });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5">
        {/* 商品ヘッダー */}
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {product.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-800">{product.name}</p>
            <p className="text-sm text-brand">¥{total}（{pickup?.extra ? `¥${product.price}＋配達¥${pickup.extra}` : "都度払い"}）</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            {step === "eat" ? "1 / 2" : step === "pickup" ? "2 / 2" : "完了"}
          </span>
        </div>

        {/* ---- Step1: いつ食べる？ ---- */}
        {step === "eat" && (
          <>
            <label className="mt-4 block text-xs font-semibold text-slate-600">
              いつ食べる？（食べる日を決めて無駄なく）
            </label>
            <input
              type="date"
              value={eatDate}
              onChange={(e) => setEatDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-500"
              >
                やめる
              </button>
              <button
                type="button"
                onClick={() => setStep("pickup")}
                className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                受け取り方法へ →
              </button>
            </div>
          </>
        )}

        {/* ---- Step2: 受け取り方法＋受取時間 ---- */}
        {step === "pickup" && (
          <>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">📍 受け取り方法</span>
              <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
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
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                        on ? "border-brand bg-brand/5" : "border-slate-200 bg-white"
                      }`}
                    >
                      <span className="text-2xl" aria-hidden>
                        {p.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{p.title}</p>
                        <p className="text-xs text-slate-500">{p.sub}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`block text-[10px] font-bold ${p.best ? "text-emerald-600" : "text-slate-400"}`}>
                          {p.badge}
                        </span>
                        <span className="text-sm font-bold text-brand">
                          {p.extra ? `+¥${p.extra}` : `¥${product.price}`}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">🕐 受取時間</span>
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
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
                    className={`rounded-lg border-2 py-2 text-center transition ${
                      on ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-800">{s.label}</span>
                    <span className="block text-[10px] text-slate-400">{s.time}〜</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setStep("eat")}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-500"
              >
                ← 戻る
              </button>
              <button
                type="button"
                onClick={place}
                disabled={!pickup || !slot}
                className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-40"
              >
                注文を確定（¥{total}）
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              ※ MVP デモのため実際の決済は行われません
            </p>
          </>
        )}

        {/* ---- Step3: 完了（QR＋ロッカー解錠） ---- */}
        {step === "done" && order && (
          <div className="mt-4 text-center">
            <div className="text-5xl">🎉</div>
            <p className="mt-1 text-lg font-bold text-slate-800">注文が完了しました！</p>
            <p className="text-sm font-semibold text-emerald-600">
              {pickup?.isLocker ? "学校帰りにロッカーへGO！" : "玄関先までお届けします！"} +{XP_REWARDS.planMeal} XP
            </p>

            {/* 受取情報 */}
            <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-left text-xs font-semibold text-slate-600">
              <div className="flex justify-between"><span>商品</span><span>{product.emoji} {product.name}</span></div>
              <div className="flex justify-between"><span>注文番号</span><span className="font-mono">#{order.no}</span></div>
              <div className="flex justify-between"><span>受取場所</span><span className="max-w-[60%] text-right">{pickup?.icon} {pickup?.title}</span></div>
              <div className="flex justify-between"><span>受取予定</span><span className="text-emerald-600">本日 {slot?.label}（{slot?.time}）以降</span></div>
              <div className="flex justify-between"><span>受取コード</span><span className="font-mono tracking-widest text-brand">{order.code}</span></div>
            </div>

            {/* QR */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500">📷 受け取りQRコード</p>
              <div className="mx-auto mt-2 w-fit rounded-xl bg-white p-2 ring-4 ring-slate-100">
                <QrCode seed={order.seed} />
              </div>
            </div>

            {/* ロッカー解錠 or 配送 */}
            {pickup?.isLocker ? (
              <button
                type="button"
                onClick={() => setOpened(true)}
                disabled={opened}
                className={`mt-4 w-full rounded-xl py-4 text-base font-bold text-white transition ${
                  opened ? "bg-emerald-600" : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {opened ? "🔓 ガチャッ！開きました 🎉" : "🔒 ロッカーを開ける"}
              </button>
            ) : (
              <div className="mt-4 rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-600">
                🛵 本日 {slot?.time}〜 玄関先までお届け予定
              </div>
            )}

            {/* 救った量 */}
            <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
              🌱 この一食で食品ロスを約 480g 削減（¥620 お得）
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-500"
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
