"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getLogs,
  getLikedPosts,
  toggleLike,
  getUserComments,
  addUserComment,
  getPostStars,
  setPostStar,
  genId,
} from "@/lib/storage";
import { buildFeed } from "@/lib/feed";
import type { FeedPost, PostComment } from "@/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

function StarRow({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-0.5 text-sm">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={score >= n ? "text-gold" : score >= n - 0.5 ? "text-gold/50" : "text-slate-200"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function StarPicker({
  postId,
  current,
  onChange,
}: {
  postId: string;
  current: number;
  onChange: (stars: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-ink-soft">評価:</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-lg transition-transform active:scale-125 ${current >= n ? "text-gold" : "text-slate-200"}`}
          aria-label={`${n}星`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

interface PostCardProps {
  post: FeedPost;
  liked: boolean;
  userComments: PostComment[];
  userStar: number;
  onLike: (id: string) => void;
  onComment: (postId: string, text: string) => void;
  onStar: (postId: string, stars: number) => void;
}

function PostCard({
  post,
  liked,
  userComments,
  userStar,
  onLike,
  onComment,
  onStar,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likeAnim, setLikeAnim] = useState(false);

  const allComments = [...post.baseComments, ...userComments].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  const totalLikes = post.baseLikes + (liked ? 1 : 0);
  const avgStars =
    post.baseStars > 0 && userStar > 0
      ? (post.baseStars + userStar) / 2
      : userStar > 0
      ? userStar
      : post.baseStars;

  function handleLike() {
    onLike(post.id);
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
  }

  function submitComment() {
    const text = commentText.trim();
    if (!text) return;
    onComment(post.id, text);
    setCommentText("");
  }

  const isOwn = post.authorId === "me";

  return (
    <article className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-card">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-2xl">
          {post.authorAvatar}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-ink leading-none">{post.authorName}</p>
            {isOwn && (
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-black text-brand">
                自分
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-soft">{timeAgo(post.postedAt)}</p>
        </div>
      </div>

      {/* 料理写真 or 絵文字プレースホルダ */}
      <div className="mx-4 overflow-hidden rounded-2xl bg-cream">
        {post.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.photoUrl}
            alt={post.dishName}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center text-[6rem]">
            {post.photoEmoji}
          </div>
        )}
      </div>

      {/* 料理名・キャプション */}
      <div className="px-4 pt-3">
        <p className="text-base font-black text-ink">{post.dishName}</p>
        {post.caption && (
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{post.caption}</p>
        )}
      </div>

      {/* 星評価表示 */}
      {avgStars > 0 && (
        <div className="flex items-center gap-2 px-4 pt-2">
          <StarRow score={avgStars} />
          <span className="text-xs font-bold text-ink-soft">{avgStars.toFixed(1)}</span>
        </div>
      )}

      {/* アクションバー */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${
            liked ? "text-red-500" : "text-ink-soft hover:text-red-400"
          }`}
        >
          <span
            className={`text-xl transition-transform duration-200 ${likeAnim ? "scale-150" : "scale-100"}`}
          >
            {liked ? "❤️" : "🤍"}
          </span>
          {totalLikes > 0 && <span>{totalLikes}</span>}
        </button>

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-brand transition-colors"
        >
          <span className="text-xl">💬</span>
          {allComments.length > 0 && <span>{allComments.length}</span>}
        </button>
      </div>

      {/* 星評価ピッカー */}
      <div className="px-4 pb-3">
        <StarPicker postId={post.id} current={userStar} onChange={(s) => onStar(post.id, s)} />
      </div>

      {/* コメントセクション（展開時） */}
      {showComments && (
        <div className="border-t border-black/5 bg-slate-50/60 px-4 py-3">
          {allComments.length > 0 && (
            <ul className="mb-3 space-y-2">
              {allComments.map((c) => (
                <li key={c.id} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-lg">{c.authorAvatar}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-ink">{c.authorName} </span>
                    <span className="text-xs text-ink-soft">{c.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="コメントを追加…"
              className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={!commentText.trim()}
              className="rounded-xl bg-brand px-3 py-2 text-sm font-black text-white disabled:opacity-40"
            >
              送信
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [userComments, setUserComments] = useState<PostComment[]>([]);
  const [userStars, setUserStars] = useState<Record<string, number>>({});

  useEffect(() => {
    const logs = getLogs();
    setPosts(buildFeed(logs));
    setLiked(getLikedPosts());
    setUserComments(getUserComments());
    setUserStars(getPostStars());
  }, []);

  const handleLike = useCallback((postId: string) => {
    const isNowLiked = toggleLike(postId);
    setLiked((prev) =>
      isNowLiked ? [...prev, postId] : prev.filter((id) => id !== postId)
    );
  }, []);

  const handleComment = useCallback((postId: string, text: string) => {
    const comment: PostComment = {
      id: genId(),
      postId,
      authorName: "あなた",
      authorAvatar: "😊",
      text,
      at: new Date().toISOString(),
    };
    const next = addUserComment(comment);
    setUserComments(next);
  }, []);

  const handleStar = useCallback((postId: string, stars: number) => {
    setPostStar(postId, stars);
    setUserStars((prev) => ({ ...prev, [postId]: stars }));
  }, []);

  return (
    <main className="page">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent">COMMUNITY</p>
          <h1 className="page-title">🍽️ フィード</h1>
        </div>
        <Link
          href="/cook"
          className="flex items-center gap-1.5 rounded-2xl bg-brand px-4 py-2.5 text-sm font-black text-white shadow-glow active:scale-95 transition-transform"
        >
          ＋ 投稿
        </Link>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-3xl border border-black/5 bg-white p-8 text-center shadow-card">
          <p className="text-4xl">🍳</p>
          <p className="mt-3 font-black text-ink">まだ投稿がありません</p>
          <p className="mt-1 text-sm text-ink-soft">最初の料理を投稿してみよう！</p>
          <Link href="/cook" className="btn-primary mt-4 inline-block">
            投稿する
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              liked={liked.includes(post.id)}
              userComments={userComments.filter((c) => c.postId === post.id)}
              userStar={userStars[post.id] ?? 0}
              onLike={handleLike}
              onComment={handleComment}
              onStar={handleStar}
            />
          ))}
        </div>
      )}

      <div className="h-4" />
    </main>
  );
}
