// ============================================================
// GET  /api/posts  … 投稿一覧（新しい順）
// POST /api/posts  … 投稿を作成
// Supabase(PostgREST) を fetch で叩く。SUPABASE_URL / SUPABASE_ANON_KEY が
// 未設定なら、サンプル投稿を返す（DB未接続でもフィードが成立するフォールバック）。
// 本物の共有フィードにするには Supabase を用意して env を設定するだけ。
//   → docs/db/FEED-DB-SETUP.md 参照
// ============================================================

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const KINDS = ["cook", "rescue", "levelup", "plan", "zeroloss"] as const;

interface FeedPost {
  id: string;
  userName: string;
  avatar: string;
  kind: (typeof KINDS)[number];
  text: string;
  photoUrl?: string;
  createdAt: string;
  likes: number;
}

function minutesAgo(n: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - n);
  return d.toISOString();
}

/** DB未接続時に返すサンプル投稿 */
function samplePosts(): FeedPost[] {
  return [
    { id: "c1", userName: "ゆうき", avatar: "🧑‍🍳", kind: "rescue", text: "期限ギリのキャベツを回鍋肉で使い切った！罪悪感ゼロ 🎉", createdAt: minutesAgo(12), likes: 8 },
    { id: "c2", userName: "みお", avatar: "👩‍🦰", kind: "cook", text: "余り野菜でラタトゥイユ作った〜。色がきれい！", createdAt: minutesAgo(48), likes: 14 },
    { id: "c3", userName: "けんと", avatar: "🧑", kind: "levelup", text: "ついに「一人前の料理人」にレベルアップ 👨‍🍳", createdAt: minutesAgo(95), likes: 21 },
    { id: "c4", userName: "さくら", avatar: "🧕", kind: "zeroloss", text: "今週ロスゼロ達成！ +500XP もらった🏆", createdAt: minutesAgo(180), likes: 33 },
    { id: "c5", userName: "だいき", avatar: "🧑‍🎓", kind: "plan", text: "明日は¥390の野菜カレーを食べる予定。計画的にいくぞ", createdAt: minutesAgo(300), likes: 5 },
    { id: "c6", userName: "あや", avatar: "👩", kind: "cook", text: "肉じゃが、はじめてうまくできた…！自炊2週間続いてる", createdAt: minutesAgo(520), likes: 27 },
  ];
}

function env() {
  return {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
  };
}

/** Supabase の行（snake_case）→ FeedPost（camelCase） */
function mapRow(r: Record<string, unknown>): FeedPost {
  return {
    id: String(r.id ?? ""),
    userName: String(r.user_name ?? "ゲスト"),
    avatar: String(r.avatar ?? "😋"),
    kind: (KINDS as readonly string[]).includes(String(r.kind))
      ? (r.kind as FeedPost["kind"])
      : "cook",
    text: String(r.text ?? ""),
    photoUrl: r.photo_url ? String(r.photo_url) : undefined,
    createdAt: String(r.created_at ?? new Date().toISOString()),
    likes: Number(r.likes ?? 0),
  };
}

export async function GET() {
  const { url, key } = env();
  if (!url || !key) {
    return NextResponse.json({ posts: samplePosts(), sample: true });
  }
  try {
    const res = await fetch(
      `${url}/rest/v1/posts?select=*&order=created_at.desc&limit=50`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error(await res.text());
    const rows = (await res.json()) as Record<string, unknown>[];
    return NextResponse.json({ posts: rows.map(mapRow) });
  } catch (e) {
    // 失敗してもフィードを止めない
    return NextResponse.json({ posts: samplePosts(), sample: true, error: String(e) });
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const text = String(body?.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "本文が空です" }, { status: 400 });
  }

  const { url, key } = env();
  if (!url || !key) {
    return NextResponse.json(
      { error: "現在サンプルモード（DB未接続）です。投稿は保存できません。", sample: true },
      { status: 503 }
    );
  }

  const row = {
    user_name: String(body?.userName ?? "ゲスト").slice(0, 20),
    avatar: String(body?.avatar ?? "😋").slice(0, 8),
    kind: (KINDS as readonly string[]).includes(String(body?.kind))
      ? String(body?.kind)
      : "cook",
    text: text.slice(0, 200),
  };

  try {
    const res = await fetch(`${url}/rest/v1/posts`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) throw new Error(await res.text());
    const created = (await res.json()) as Record<string, unknown>[];
    return NextResponse.json({ post: mapRow(created[0] ?? {}) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
