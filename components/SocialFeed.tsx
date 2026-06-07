"use client";

// みんなの投稿フィード（ホームに表示）。
// Supabase の posts テーブルを全員で共有。ログイン時のみ投稿でき、自分の投稿だけ削除できる（RLSで保護）。
// 未設定（環境変数なし）の場合は「準備中」表示にフォールバックし、アプリを壊さない。

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface Post {
  id: string;
  user_id: string;
  author_name: string;
  dish_name: string;
  comment: string | null;
  created_at: string;
}

/** 設定有無で出し分け（フックの条件分岐を避けるためラッパーに） */
export default function SocialFeed() {
  if (!isSupabaseConfigured) {
    return (
      <section className="mt-6">
        <h2 className="section-title">🍚 みんなの投稿</h2>
        <div className="card-soft text-sm text-ink-soft">
          みんなの投稿フィードは <strong className="text-ink">準備中</strong> です（バックエンド設定後に表示されます）。
        </div>
      </section>
    );
  }
  return <SocialFeedInner />;
}

function SocialFeedInner() {
  const [supabase] = useState(() => createClient());
  const [posts, setPosts] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [dish, setDish] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
    setAuthorName(
      (user?.user_metadata?.author_name as string) ||
        user?.email?.split("@")[0] ||
        ""
    );
    const { data, error } = await supabase
      .from("posts")
      .select("id, user_id, author_name, dish_name, comment, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) setErr(error.message);
    else setPosts((data as Post[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dish.trim()) return;
    setPosting(true);
    setErr(null);
    const { error } = await supabase.from("posts").insert({
      author_name: authorName || "名無しシェフ",
      dish_name: dish.trim(),
      comment: comment.trim() || null,
    });
    if (error) setErr(error.message);
    else {
      setDish("");
      setComment("");
      await load();
    }
    setPosting(false);
  }

  async function remove(id: string) {
    if (!window.confirm("この投稿を削除しますか？")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) setErr(error.message);
    else setPosts((p) => p.filter((x) => x.id !== id));
  }

  return (
    <section className="mt-6">
      <h2 className="section-title">🍚 みんなの投稿</h2>

      {userId ? (
        <form onSubmit={submit} className="card mb-3 space-y-2">
          <input
            className="field"
            value={dish}
            onChange={(e) => setDish(e.target.value)}
            maxLength={40}
            placeholder="作った料理（例：肉じゃが）"
          />
          <input
            className="field"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={80}
            placeholder="ひとこと（任意）"
          />
          <button type="submit" disabled={posting || !dish.trim()} className="btn-primary w-full">
            {posting ? "投稿中…" : "投稿する"}
          </button>
        </form>
      ) : (
        <Link
          href="/login"
          className="mb-3 flex items-center justify-between rounded-2xl border border-brand/20 bg-brand-light/50 p-4 text-sm font-bold text-ink"
        >
          <span>ログインすると、料理を投稿できます</span>
          <span className="shrink-0 text-brand">ログイン →</span>
        </Link>
      )}

      {err && <p className="mb-2 text-xs font-semibold text-urgent">{err}</p>}

      {loading ? (
        <p className="card-soft text-sm text-ink-soft">読み込み中…</p>
      ) : posts.length === 0 ? (
        <p className="card-soft text-sm text-ink-soft">
          まだ投稿がありません。最初の一品を投稿してみよう！
        </p>
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => (
            <li key={p.id} className="rounded-2xl border border-black/5 bg-white p-3.5 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-light text-sm" aria-hidden>
                    🧑‍🍳
                  </span>
                  <span className="text-sm font-black text-ink">{p.author_name}</span>
                </div>
                <span className="text-[11px] text-ink-soft">{timeAgo(p.created_at)}</span>
              </div>
              <p className="mt-2 text-sm font-bold text-ink">
                <span aria-hidden>🍳 </span>
                {p.dish_name}
              </p>
              {p.comment && <p className="mt-0.5 text-sm text-ink-soft">{p.comment}</p>}
              {p.user_id === userId && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="text-xs font-bold text-urgent hover:underline"
                  >
                    削除
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** 相対時刻（◯分前 / ◯時間前 / ◯日前） */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}
