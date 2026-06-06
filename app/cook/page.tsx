"use client";

import { useEffect, useRef, useState } from "react";
import {
  getProgress,
  saveProgress,
  addLog,
  getLogs,
  genId,
} from "@/lib/storage";
import { applyXP, XP_REWARDS, stageFromLevel } from "@/lib/xp";
import LevelUpCelebration from "@/components/LevelUpCelebration";
import type { CookingLog } from "@/types";

export default function CookPage() {
  const [dishName, setDishName] = useState("");
  const [caption, setCaption] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [logs, setLogs] = useState<CookingLog[]>([]);
  const [showXP, setShowXP] = useState(false);
  const [levelUp, setLevelUp] = useState<{ level: number; newStage: boolean } | null>(null);
  const [posted, setPosted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLogs(getLogs());
  }, []);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  }

  function handlePost() {
    if (!dishName.trim()) return;

    const log: CookingLog = {
      id: genId(),
      dishName: dishName.trim(),
      caption: caption.trim(),
      photoUrl,
      xpEarned: XP_REWARDS.cookPhoto,
      cookedAt: new Date().toISOString(),
    };
    const nextLogs = addLog(log);

    const before = getProgress();
    const next = applyXP(before, XP_REWARDS.cookPhoto, true);
    saveProgress(next);

    setLogs(nextLogs);
    setDishName("");
    setCaption("");
    setPhotoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";

    setShowXP(false);
    requestAnimationFrame(() => setShowXP(true));
    window.setTimeout(() => setShowXP(false), 1500);

    setPosted(true);
    window.setTimeout(() => setPosted(false), 2500);

    if (next.level > before.level) {
      setLevelUp({
        level: next.level,
        newStage: stageFromLevel(next.level).stage !== stageFromLevel(before.level).stage,
      });
    }
  }

  const canPost = dishName.trim().length > 0;

  return (
    <main className="page">
      <LevelUpCelebration
        level={levelUp?.level ?? null}
        newStage={levelUp?.newStage}
        onClose={() => setLevelUp(null)}
      />

      <header className="mb-5">
        <p className="text-xs font-bold tracking-widest text-accent">POST</p>
        <h1 className="page-title">📸 投稿する</h1>
        <p className="page-sub">作った料理をみんなにシェアしよう</p>
      </header>

      {/* 投稿成功トースト */}
      {posted && (
        <div className="mb-4 animate-pop-in rounded-2xl bg-brand px-4 py-3 text-center text-sm font-black text-white shadow-glow">
          🎉 投稿しました！フィードに表示されます ＋{XP_REWARDS.cookPhoto} XP
        </div>
      )}

      {/* 入力カード */}
      <section className="card relative">
        {/* 料理名 */}
        <label className="block">
          <span className="field-label">料理名 *</span>
          <input
            type="text"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            placeholder="例：肉じゃが"
            className="field"
          />
        </label>

        {/* キャプション */}
        <div className="mt-4">
          <span className="field-label">ひとこと</span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="作り方のポイントや感想をシェアしよう（任意）"
            rows={3}
            className="field mt-1 resize-none"
          />
        </div>

        {/* 写真アップロード */}
        <div className="mt-4">
          <span className="field-label">写真</span>
          <label className="mt-1 flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-ink/15 bg-cream text-ink-soft transition hover:border-brand hover:text-brand">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="料理の写真プレビュー"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">📷 写真を撮る / 選ぶ（任意）</span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhoto}
              className="hidden"
            />
          </label>
        </div>

        {/* 投稿ボタン */}
        <button
          type="button"
          onClick={handlePost}
          disabled={!canPost}
          className="btn-accent mt-5 w-full py-3 text-base"
        >
          🍳 投稿する（＋{XP_REWARDS.cookPhoto} XP）
        </button>

        {/* XP獲得アニメーション */}
        {showXP && (
          <div
            key={logs.length}
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex justify-center"
          >
            <span className="animate-xp-pop text-3xl font-black text-accent drop-shadow">
              +{XP_REWARDS.cookPhoto} XP!
            </span>
          </div>
        )}
      </section>

      {/* 過去の投稿（新しい順） */}
      <section className="mt-8">
        <h2 className="section-title">これまでの投稿</h2>
        {logs.length === 0 ? (
          <p className="card-soft text-sm text-ink-soft">
            まだ投稿がありません。最初の一品を投稿しよう！
          </p>
        ) : (
          <ul className="space-y-2.5">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-card"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-cream">
                  {log.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={log.photoUrl}
                      alt={log.dishName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">
                      🍽️
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-ink">{log.dishName}</p>
                  {log.caption && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{log.caption}</p>
                  )}
                  <p className="mt-1 text-xs text-ink-soft">
                    {new Date(log.cookedAt).toLocaleString("ja-JP", {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-sm font-black text-accent">
                  +{log.xpEarned}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
