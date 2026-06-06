"use client";

// 今週の成果（/summary）
// 直近7日で「救った」食品ロスを、品数・節約額・CO2 で見せ、週次でSNSシェアする。
// 全期間レポートは /stats。こちらは週次にフォーカス（CO2 削減の概算つき）。

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLossEvents, getProgress } from "@/lib/storage";
import { computeWeeklySaved, recentSaved, type WeeklySaved } from "@/lib/weekly";
import { computeLossStats } from "@/lib/loss";
import { stageFromLevel } from "@/lib/xp";
import ShareCard from "@/components/ShareCard";
import type { LossEvent } from "@/types";
import type { ShareData } from "@/lib/share";

const EMPTY: WeeklySaved = {
  savedCount: 0,
  savedYen: 0,
  savedCo2Kg: 0,
  wastedCount: 0,
  days: 7,
};

export default function SummaryPage() {
  const [week, setWeek] = useState<WeeklySaved>(EMPTY);
  const [recent, setRecent] = useState<LossEvent[]>([]);
  const [share, setShare] = useState<ShareData | null>(null);

  useEffect(() => {
    const ev = getLossEvents();
    const w = computeWeeklySaved(ev);
    const stats = computeLossStats(ev);
    const progress = getProgress();
    const stage = stageFromLevel(progress.level);
    setWeek(w);
    setRecent(recentSaved(ev));
    setShare({
      level: progress.level,
      stageName: stage.name,
      emoji: stage.emoji,
      savedCount: w.savedCount,
      savedYen: w.savedYen,
      streakDays: stats.streakDays,
    });
  }, []);

  return (
    <main className="page">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent">THIS WEEK</p>
          <h1 className="page-title">📅 今週の成果</h1>
          <p className="page-sub">直近7日であなたが救った食品ロス</p>
        </div>
        <div className="text-4xl" aria-hidden>
          🌱
        </div>
      </header>

      {/* ヒーロー：今週の救出品数 ＋ 節約額 ＋ CO2 */}
      <section className="mt-5 overflow-hidden rounded-4xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-glow">
        <p className="text-xs font-semibold text-white/80">今週 救った食材</p>
        <p className="mt-1 text-5xl font-black leading-none">
          {week.savedCount}
          <span className="text-2xl font-black"> 品</span>
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/15 p-3">
            <p className="text-[11px] font-semibold text-white/75">節約できた額</p>
            <p className="text-2xl font-black leading-none">¥{week.savedYen.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3">
            <p className="text-[11px] font-semibold text-white/75">CO₂ 削減（概算）</p>
            <p className="text-2xl font-black leading-none">
              {week.savedCo2Kg}
              <span className="text-sm font-black"> kg</span>
            </p>
          </div>
        </div>
      </section>

      {week.savedCount === 0 && (
        <div className="card-soft mt-4 text-sm text-ink-soft">
          今週はまだ記録がありません。冷蔵庫で食材を「使った」と、ここに今週の成果が貯まります。
          <div className="mt-3">
            <Link href="/fridge" className="btn-ghost">
              冷蔵庫へ
            </Link>
          </div>
        </div>
      )}

      {/* 今週 救った食材の一覧 */}
      {recent.length > 0 && (
        <section className="mt-6">
          <h2 className="section-title">✅ 今週 救った食材</h2>
          <ul className="space-y-2">
            {recent.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-3 shadow-card"
              >
                <span className="text-sm font-semibold text-ink">
                  <span aria-hidden>🥬 </span>
                  {e.itemName}
                </span>
                <span className="chip border-brand/30 bg-brand-light text-brand">
                  ¥{e.estimatedYen}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 今週の成果をシェア */}
      <section className="mt-6">
        <h2 className="section-title">📣 今週の成果をシェア</h2>
        {share && <ShareCard data={share} />}
      </section>

      <div className="mb-2 mt-6 text-center">
        <Link href="/stats" className="text-xs font-bold text-brand">
          全期間のレポートを見る →
        </Link>
      </div>
    </main>
  );
}
