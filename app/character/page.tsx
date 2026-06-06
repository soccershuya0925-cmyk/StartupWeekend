"use client";

// 担当: エンジニアA（キャラクター詳細 /character）
// docs/tasks/A-home-character.md の受け入れ条件に対応

import { useEffect, useState } from "react";
import {
  getProgress,
  getLogs,
  saveProgress,
  getRedemptions,
  addRedemption,
  genId,
} from "@/lib/storage";
import {
  xpToNextLevel,
  STAMPS_PER_REWARD,
  STAGES,
  stageFromLevel,
  availableStamps,
  redeemStamps,
} from "@/lib/xp";
import { REWARDS, genCouponCode } from "@/lib/loss";
import CharacterDisplay from "@/components/CharacterDisplay";
import XPBar from "@/components/XPBar";
import StageArt from "@/components/character/StageArt";
import type { CookingLog, UserProgress, Redemption, Reward } from "@/types";

// storage の DEFAULT_PROGRESS 相当
const DEFAULT_PROGRESS: UserProgress = {
  level: 1,
  totalXP: 0,
  stamps: 0,
  cookingCount: 0,
  redeemedStamps: 0,
};

export default function CharacterPage() {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [logs, setLogs] = useState<CookingLog[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [justRedeemed, setJustRedeemed] = useState<Redemption | null>(null);

  // localStorage 読み出しは useEffect 内
  useEffect(() => {
    setProgress(getProgress());
    setRedemptions(getRedemptions());
    // addLog は先頭追加なので getLogs 自体が新しい順だが、明示的に並べ替える
    setLogs(
      [...getLogs()].sort(
        (a, b) =>
          new Date(b.cookedAt).getTime() - new Date(a.cookedAt).getTime()
      )
    );
  }, []);

  const available = availableStamps(progress);
  const stamps = Math.min(available, STAMPS_PER_REWARD);
  const currentStage = stageFromLevel(progress.level);

  /** 特典を交換: スタンプを消費し、クーポンコードを発行して履歴に残す */
  function handleRedeem(reward: Reward) {
    if (available < reward.cost) return;
    const next = redeemStamps(progress, reward.cost);
    saveProgress(next);
    setProgress(next);

    const redemption: Redemption = {
      id: genId(),
      rewardId: reward.id,
      rewardName: reward.name,
      code: genCouponCode(reward, next.totalXP + next.redeemedStamps!),
      cost: reward.cost,
      at: new Date().toISOString(),
    };
    setRedemptions(addRedemption(redemption));
    setJustRedeemed(redemption);
  }

  return (
    <main className="page">
      <h1 className="page-title">⭐ キャラクター</h1>

      {/* レベルと次までのXP */}
      <section className="mt-4 overflow-hidden rounded-4xl bg-gradient-to-b from-brand-light to-white p-6 shadow-card">
        <CharacterDisplay level={progress.level} size="lg" />
        <div className="mt-5">
          <XPBar totalXP={progress.totalXP} />
        </div>
        <p className="mt-3 text-center text-xs font-semibold text-ink-soft">
          次のレベルまで あと{xpToNextLevel(progress.totalXP)} XP
        </p>
      </section>

      {/* 成長ロードマップ（5段階） */}
      <section className="mt-6">
        <h2 className="section-title">🌱 成長ロードマップ</h2>
        <div className="flex items-end justify-between gap-1 rounded-3xl border border-black/5 bg-white p-4 shadow-card">
          {STAGES.map((s) => {
            const reached = progress.level >= s.minLevel;
            const isCurrent = s.stage === currentStage.stage;
            return (
              <div
                key={s.stage}
                className={`flex flex-1 flex-col items-center text-center transition ${
                  reached ? "" : "opacity-30 grayscale"
                }`}
              >
                <div className={isCurrent ? "animate-float-slow" : ""}>
                  <StageArt stage={s.stage} size={isCurrent ? 52 : 40} />
                </div>
                <p
                  className={`mt-1 text-[11px] font-bold leading-tight ${
                    isCurrent ? "text-brand" : "text-ink-soft"
                  }`}
                >
                  Lv.{s.minLevel}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* スタンプカード */}
      <section className="mt-6">
        <h2 className="section-title">
          🎟 スタンプカード
          <span className="ml-auto rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-black text-brand">
            利用可能 {available}個
          </span>
        </h2>
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-card">
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: STAMPS_PER_REWARD }, (_, i) => {
              const filled = i < stamps;
              return (
                <div
                  key={i}
                  className={`flex aspect-square items-center justify-center rounded-full border-2 text-lg font-black ${
                    filled
                      ? "animate-stamp-in border-brand bg-brand-light text-brand"
                      : "border-dashed border-ink/20 text-ink-soft/40"
                  }`}
                  aria-label={filled ? "獲得済みスタンプ" : "未獲得スタンプ"}
                >
                  {filled ? "⭐" : i + 1}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs font-semibold text-ink-soft">
            料理5回ごとに1個。スタンプを使って特典と交換しよう！
          </p>
        </div>
      </section>

      {/* 特典と交換（機能⑤） */}
      <section className="mt-6">
        <h2 className="section-title">🎁 特典と交換</h2>

        {/* 交換直後のクーポン表示 */}
        {justRedeemed && (
          <div className="mb-3 animate-pop-in rounded-3xl border-2 border-dashed border-gold bg-gold/10 p-4 text-center">
            <p className="text-xs font-bold text-ink-soft">
              {justRedeemed.rewardName} のクーポン
            </p>
            <p className="mt-1 text-2xl font-black tracking-widest text-ink">
              {justRedeemed.code}
            </p>
            <p className="mt-1 text-[11px] text-ink-soft">
              提携店でこの画面を見せてください 🎉
            </p>
          </div>
        )}

        <ul className="space-y-2.5">
          {REWARDS.map((reward) => {
            const enough = available >= reward.cost;
            return (
              <li
                key={reward.id}
                className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3.5 shadow-card"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream text-xl" aria-hidden>
                  {reward.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-ink">{reward.name}</p>
                  <p className="text-xs text-ink-soft">
                    {reward.partner} ・ ⭐×{reward.cost}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRedeem(reward)}
                  disabled={!enough}
                  className="btn-accent shrink-0 px-3 py-2 text-xs"
                >
                  {enough ? "交換" : `あと${reward.cost - available}`}
                </button>
              </li>
            );
          })}
        </ul>

        {/* 交換履歴 */}
        {redemptions.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold text-ink-soft">交換履歴</p>
            <ul className="space-y-2">
              {redemptions.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-ink">
                    🎟 {r.rewardName}
                  </span>
                  <span className="font-mono text-ink-soft">{r.code}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 過去の料理記録一覧 */}
      <section className="mt-6">
        <h2 className="section-title">📖 料理の記録</h2>
        {logs.length === 0 ? (
          <p className="card-soft text-sm text-ink-soft">
            まだ料理の記録がありません。料理を記録してXPを貯めましょう！
          </p>
        ) : (
          <ul className="space-y-2.5">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-card"
              >
                {log.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={log.photoUrl}
                    alt={log.dishName}
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cream text-2xl">
                    🍽️
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-ink">
                    {log.dishName}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {new Date(log.cookedAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-light px-2.5 py-1 text-xs font-black text-brand">
                  +{log.xpEarned} XP
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
