"use client";

import { useEffect, useState } from "react";

const ONBOARDED_KEY = "meshikatsu:onboarded";

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: "🧾",
    title: "レシートを撮るだけ",
    body: "レシートを撮影すると、AIが食材を読み取って冷蔵庫に自動登録。手入力ゼロで管理が始まります。",
  },
  {
    emoji: "🧊",
    title: "冷蔵庫をまるごと見える化",
    body: "登録した食材は期限がヤバい順に並びます。何が・いつまでかが一目でわかるから、腐らせる前に使い切れます。",
  },
  {
    emoji: "⏰",
    title: "ムダを防ぐ",
    body: "消費期限が近い食材をアラート。期限内に使い切ると XP がもらえて、節約できた金額が貯まっていきます。",
  },
  {
    emoji: "🛒",
    title: "足りない分は¥390で",
    body: "在庫が少ない時はショップでワンタップ補充。買った食材はそのまま冷蔵庫に入り、使い切りのループが回ります。",
  },
  {
    emoji: "👨‍🍳",
    title: "ゲーム感覚で続く",
    body: "料理するたびキャラが育ち、今週の成果はSNSにシェアできる。楽しく続けるうちに、食品ロスがゼロへ近づきます。",
  },
];

/** beforeinstallprompt イベントの最小型 */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** 初回起動時に一度だけ表示するチュートリアル＋インストール導線 */
export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);

  // 初回判定（localStorage）。SSR とのズレを避けるため mount 後に判定。
  useEffect(() => {
    try {
      const standalone =
        window.matchMedia?.("(display-mode: standalone)").matches ||
        // iOS Safari
        (window.navigator as Navigator & { standalone?: boolean }).standalone;
      if (!standalone && localStorage.getItem(ONBOARDED_KEY) !== "1") {
        setOpen(true);
      }
    } catch {
      /* localStorage 不可環境では出さない */
    }

    // 「ホーム画面に追加」プロンプトを捕捉
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    // 外部から再表示できるようにする（ホームの「チュートリアルを見る」）
    const reopen = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener("meshikatsu:open-onboarding", reopen);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("meshikatsu:open-onboarding", reopen);
    };
  }, []);

  function finish() {
    try {
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {
      /* noop */
    }
    setOpen(false);
  }

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  if (!open) return null;

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center">
      <div className="animate-slide-up w-full max-w-md rounded-t-4xl bg-gradient-to-b from-white to-cream p-6 pb-8 shadow-card sm:rounded-4xl">
        {/* スキップ */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={finish}
            className="text-xs font-bold text-ink-soft/70 hover:text-ink"
          >
            スキップ
          </button>
        </div>

        {/* スライド本体 */}
        <div className="mt-2 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-4xl bg-brand-light text-6xl">
            <span className="animate-float-slow" aria-hidden>
              {slide.emoji}
            </span>
          </div>
          <h2 className="mt-5 text-xl font-black text-ink">{slide.title}</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
            {slide.body}
          </p>
        </div>

        {/* ドット */}
        <div className="mt-5 flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-brand" : "w-2 bg-ink/15"
              }`}
            />
          ))}
        </div>

        {/* アクション */}
        <div className="mt-6">
          {isLast ? (
            <div className="space-y-2">
              {installEvent && (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="btn-ghost w-full"
                >
                  📲 ホーム画面に追加
                </button>
              )}
              <button type="button" onClick={finish} className="btn-primary w-full py-3">
                はじめる
              </button>
              {!installEvent && (
                <p className="pt-1 text-center text-[11px] text-ink-soft">
                  iPhone は「共有 → ホーム画面に追加」でアプリのように使えます
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIndex((i) => i + 1)}
              className="btn-primary w-full py-3"
            >
              次へ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
