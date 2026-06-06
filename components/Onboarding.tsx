"use client";

// 初回オンボーディング：初めて開いた人にアプリの価値と使い方を3ステップで案内。
// localStorage の onboarded フラグで「初回だけ」表示する。

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isOnboarded, setOnboarded } from "@/lib/storage";
import { seedDemo } from "@/lib/seed";

interface Step {
  emoji: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    emoji: "🍳",
    title: "ようこそ、メシ活へ",
    body: "一人暮らしの食品ロスをゼロにする、ゲーム感覚の食品管理アプリ。捨てる罪悪感も、ムダな出費もなくそう。",
  },
  {
    emoji: "🧊",
    title: "冷蔵庫を“見える化”",
    body: "在庫を登録すると消費期限を色分け表示。レシートはAIで自動登録、足りない一品は¥390で届きます。",
  },
  {
    emoji: "⭐",
    title: "使い切るほど育つ",
    body: "期限内に使い切る・予定どおり食べると XP獲得。キャラが育ち、ロスゼロ週間で特別ボーナスも。",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  // SSR では window が無いので、マウント後にだけ判定する
  useEffect(() => {
    if (!isOnboarded()) setShow(true);
  }, []);

  if (!show) return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  function finish(withDemo: boolean) {
    setOnboarded();
    setShow(false);
    if (withDemo) {
      seedDemo();
      window.location.reload();
    } else {
      router.push("/fridge");
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        {/* ステップ表示 */}
        <div className="flex flex-col items-center text-center">
          <div className="text-6xl" aria-hidden>
            {current.emoji}
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-800">
            {current.title}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{current.body}</p>
        </div>

        {/* ドット */}
        <div className="mt-5 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-5 bg-brand" : "w-1.5 bg-slate-300"
              }`}
            />
          ))}
        </div>

        {/* ボタン */}
        <div className="mt-6">
          {isLast ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => finish(true)}
                className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark"
              >
                デモデータで試してみる
              </button>
              <button
                type="button"
                onClick={() => finish(false)}
                className="w-full rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-600"
              >
                自分の冷蔵庫から始める
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setOnboarded();
                  setShow(false);
                }}
                className="text-sm text-slate-400"
              >
                スキップ
              </button>
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
              >
                次へ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
