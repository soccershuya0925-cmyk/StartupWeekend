"use client";

// ログイン / 新規登録（メール＋パスワード）。
// みんなの投稿フィード（/）に投稿・削除するために使用。
// 未設定（環境変数なし）の場合は案内表示にフォールバック。

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 未設定ガード（フックの後・JSX前なので Rules of Hooks 違反なし）
  if (!isSupabaseConfigured) {
    return (
      <main className="page">
        <h1 className="page-title">🔑 ログイン</h1>
        <p className="card-soft mt-4 text-sm text-ink-soft">
          ログイン機能はバックエンド設定後に有効になります（
          <code className="text-ink">docs/SUPABASE-SETUP.md</code> 参照）。
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-bold text-brand">
          ← ホームにもどる
        </Link>
      </main>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { author_name: name || email.split("@")[0] } },
        });
        if (error) throw error;
        // メール確認が無効なら即セッション発行 → ログイン扱い
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          router.push("/");
          router.refresh();
          return;
        }
        setMsg("登録しました！確認メールが届く設定の場合は、確認後にログインしてください。");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
        return;
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "うまくいきませんでした");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <h1 className="page-title">{mode === "login" ? "🔑 ログイン" : "📝 新規登録"}</h1>
      <p className="page-sub">みんなの投稿に参加しよう。</p>

      <form onSubmit={submit} className="card mt-5 space-y-3">
        {mode === "signup" && (
          <div>
            <label className="field-label" htmlFor="name">
              表示名（ニックネーム）
            </label>
            <input
              id="name"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="例：しゅうや"
            />
          </div>
        )}
        <div>
          <label className="field-label" htmlFor="email">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            required
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            パスワード（6文字以上）
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
          />
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy ? "処理中…" : mode === "login" ? "ログイン" : "登録してはじめる"}
        </button>
      </form>

      {msg && <p className="mt-3 text-center text-sm font-semibold text-brand-dark">{msg}</p>}

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "login" ? "signup" : "login"));
          setMsg(null);
        }}
        className="mt-4 w-full text-center text-sm font-bold text-ink-soft"
      >
        {mode === "login" ? "アカウントがない → 新規登録" : "アカウントがある → ログイン"}
      </button>

      <div className="mt-6 text-center">
        <Link href="/" className="text-xs font-bold text-brand">
          ← ホームにもどる
        </Link>
      </div>
    </main>
  );
}
