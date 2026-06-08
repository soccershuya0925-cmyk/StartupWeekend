"use client";

// コミュニティフィード（みんなの食ログ）
// 他ユーザーの投稿＋自分の料理記録が時系列で流れてくる。
// 「一人だと続かない」を、ゆるい繋がりで支える画面。

import { useEffect, useState } from "react";
import { buildFeed, timeAgo, KIND_BADGE, type FeedPost } from "@/lib/feed";

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  // ローカルの「いいね」状態（押した投稿ID）
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  // localStorage 読み出しは useEffect 内（ハイドレーション不整合を避ける）
  useEffect(() => {
    setPosts(buildFeed());
  }, []);

  function toggleLike(id: string) {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <main className="px-4 py-6">
      <h1 className="text-xl font-bold text-slate-800">フィード 👥</h1>
      <p className="mt-1 text-sm text-slate-500">
        みんなの食ログ。今日もどこかで誰かがロスを減らしてる。
      </p>

      <ul className="mt-5 space-y-3">
        {posts.map((p) => {
          const isLiked = liked[p.id];
          const likeCount = p.likes + (isLiked ? 1 : 0);
          return (
            <li
              key={p.id}
              className={`rounded-2xl border p-4 ${
                p.isSelf
                  ? "border-brand/30 bg-brand/5"
                  : "border-slate-200 bg-white"
              }`}
            >
              {/* ヘッダー: アバター + 名前 + 時刻 */}
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>
                  {p.avatar}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {p.userName}
                    {p.isSelf && (
                      <span className="ml-1 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                        あなた
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {timeAgo(p.createdAt)}
                  </p>
                </div>
                <span className="text-lg" aria-hidden title={p.kind}>
                  {KIND_BADGE[p.kind]}
                </span>
              </div>

              {/* 本文 */}
              <p className="mt-2 text-sm text-slate-700">{p.text}</p>

              {/* 写真（あれば） */}
              {p.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.photoUrl}
                  alt=""
                  className="mt-3 max-h-56 w-full rounded-lg object-cover"
                />
              )}

              {/* いいね */}
              <button
                type="button"
                onClick={() => toggleLike(p.id)}
                className={`mt-3 flex items-center gap-1 text-sm font-semibold transition-colors ${
                  isLiked ? "text-urgent" : "text-slate-400 hover:text-slate-600"
                }`}
                aria-pressed={isLiked}
              >
                <span>{isLiked ? "❤️" : "🤍"}</span>
                {likeCount}
              </button>
            </li>
          );
        })}
      </ul>

      {/* MVP の但し書き（発表用の正直さ） */}
      <p className="mt-6 text-center text-[11px] text-slate-300">
        ※ サンプルのコミュニティ投稿を含みます（実ユーザー間共有はDB連携で実装予定）
      </p>
    </main>
  );
}
