"use client";

// ロス削減ダッシュボード（/stats）
// 事業計画書 §2「食品ロスの罪悪感と金銭ロス」を数字で可視化する。
// 救った食材・節約額・ロス率・ロスゼロ継続を表示。

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLossEvents, getProgress } from "@/lib/storage";
import { computeLossStats, type LossStats } from "@/lib/loss";
import { stageFromLevel } from "@/lib/xp";
import ShareCard from "@/components/ShareCard";
import type { LossEvent } from "@/types";
import type { ShareData } from "@/lib/share";

const EMPTY: LossStats = {
  savedCount: 0,
  savedYen: 0,
  wastedCount: 0,
  wastedYen: 0,
  lossRate: 0,
  streakDays: 0,
  zeroLossWeeks: 0,
  weekly: [],
};

export default function StatsPage() {
  const [stats, setStats] = useState<LossStats>(EMPTY);
  const [events, setEvents] = useState<LossEvent[]>([]);
  const [share, setShare] = useState<ShareData | null>(null);

  useEffect(() => {
    const ev = getLossEvents();
    const st = computeLossStats(ev);
    const progress = getProgress();
    const stage = stageFromLevel(progress.level);
    setEvents(ev);
    setStats(st);
    setShare({
      level: progress.level,
      stageName: stage.name,
      emoji: stage.emoji,
      savedCount: st.savedCount,
      savedYen: st.savedYen,
      streakDays: st.streakDays,
    });
  }, []);

  const lossPct = Math.round(stats.lossRate * 100);
  const savedPct = 100 - lossPct;
  const maxBar = Math.max(1, ...stats.weekly.map((d) => d.saved + d.wasted));

  return (
    <main className="page">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent">REPORT</p>
          <h1 className="page-title">📊 ロス削減レポート</h1>
          <p className="page-sub">あなたが減らした食品ロスの記録</p>
        </div>
        <div className="text-4xl" aria-hidden>
          ♻️
        </div>
      </header>

      {/* 節約額（ヒーロー） */}
      <section className="mt-5 overflow-hidden rounded-4xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-glow">
        <p className="text-xs font-semibold text-white/80">これまでに節約できた金額</p>
        <p className="mt-1 text-5xl font-black leading-none">
          ¥{stats.savedYen.toLocaleString()}
        </p>
        <p className="mt-2 text-sm font-semibold text-white/85">
          🥬 {stats.savedCount}品の食材を救いました
        </p>
      </section>

      {/* 継続日数 & ロス率 */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-card">
          <p className="text-xs font-bold text-ink-soft">🔥 ロスゼロ継続</p>
          <p className="mt-1 text-3xl font-black text-ink">
            {stats.streakDays}
            <span className="text-base font-bold">日</span>
          </p>
          {stats.zeroLossWeeks > 0 && (
            <p className="mt-1 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
              ゼロロス週間 ×{stats.zeroLossWeeks}
            </p>
          )}
        </div>
        <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-card">
          <p className="text-xs font-bold text-ink-soft">♻️ ロス率</p>
          <p className="mt-1 text-3xl font-black text-ink">{lossPct}%</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-safe"
              style={{ width: `${savedPct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] font-semibold text-ink-soft">
            使い切り {savedPct}% / 処分 {lossPct}%
          </p>
        </div>
      </section>

      {/* 週間グラフ（直近7日） */}
      <section className="mt-6">
        <h2 className="section-title">📅 直近7日</h2>
        <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-card">
          {stats.weekly.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-soft">
              まだ記録がありません
            </p>
          ) : (
            <div className="flex items-end justify-between gap-2" style={{ height: 96 }}>
              {stats.weekly.map((d, i) => {
                const total = d.saved + d.wasted;
                const h = Math.round((total / maxBar) * 72);
                return (
                  <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                    <div
                      className="flex w-full max-w-[28px] flex-col-reverse overflow-hidden rounded-lg"
                      style={{ height: Math.max(4, h) }}
                    >
                      {d.saved > 0 && (
                        <div
                          className="bg-brand"
                          style={{ flexGrow: d.saved }}
                          title={`救った ${d.saved}`}
                        />
                      )}
                      {d.wasted > 0 && (
                        <div
                          className="bg-urgent"
                          style={{ flexGrow: d.wasted }}
                          title={`処分 ${d.wasted}`}
                        />
                      )}
                      {total === 0 && <div className="h-1 w-full bg-ink/10" />}
                    </div>
                    <span className="text-[10px] font-bold text-ink-soft">{d.label}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-3 flex justify-center gap-4 text-[11px] font-semibold text-ink-soft">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-brand" />救った
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-urgent" />処分
            </span>
          </div>
        </div>
      </section>

      {/* 最近の記録 */}
      <section className="mt-6">
        <h2 className="section-title">🧾 最近の記録</h2>
        {events.length === 0 ? (
          <div className="card-soft text-sm text-ink-soft">
            まだ記録がありません。冷蔵庫で食材を「使った」と、ここに節約が貯まります。
            <div className="mt-3">
              <Link href="/fridge" className="btn-ghost">
                冷蔵庫へ
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {events.slice(0, 10).map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-3 shadow-card"
              >
                <span className="text-sm font-semibold text-ink">
                  {e.type === "saved" ? "✅ " : "🗑 "}
                  {e.itemName}
                </span>
                <span
                  className={`chip ${
                    e.type === "saved"
                      ? "border-brand/30 bg-brand-light text-brand"
                      : "border-urgent/30 bg-urgent/10 text-urgent"
                  }`}
                >
                  {e.type === "saved" ? `救った ¥${e.estimatedYen}` : `処分 ¥${e.estimatedYen}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 実績をSNSにシェア */}
      <section className="mt-6">
        <h2 className="section-title">📣 実績をシェア</h2>
        {share && <ShareCard data={share} />}
      </section>
    </main>
  );
}
