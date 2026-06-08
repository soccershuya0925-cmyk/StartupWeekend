// ============================================================
// コミュニティフィード（みんなの食ログ）
// MVP: サンプルの他ユーザー投稿 ＋ 自分の料理記録 を時系列で混ぜて流す。
// ※ 本物のユーザー間共有はバックエンドが必要（Issue #8: DB化）。
//    その際は buildFeed() の中身を fetch に差し替えるだけで画面は無修正。
// ============================================================

import { getLogs } from "@/lib/storage";

export type FeedKind = "cook" | "rescue" | "levelup" | "plan" | "zeroloss";

export interface FeedPost {
  id: string;
  userName: string;
  avatar: string; // 絵文字アバター
  kind: FeedKind;
  text: string;
  photoUrl?: string;
  createdAt: string; // ISO 8601
  likes: number;
  isSelf?: boolean; // 自分の投稿
}

/** 種類ごとのアクセント絵文字 */
export const KIND_BADGE: Record<FeedKind, string> = {
  cook: "🍳",
  rescue: "🛟",
  levelup: "⭐",
  plan: "📅",
  zeroloss: "🏆",
};

/** n 分前の ISO を返す */
function minutesAgo(n: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - n);
  return d.toISOString();
}

/** サンプルのコミュニティ投稿（他ユーザー） */
const SAMPLE_COMMUNITY: FeedPost[] = [
  {
    id: "c1",
    userName: "ゆうき",
    avatar: "🧑‍🍳",
    kind: "rescue",
    text: "期限ギリのキャベツを回鍋肉で使い切った！罪悪感ゼロ 🎉",
    createdAt: minutesAgo(12),
    likes: 8,
  },
  {
    id: "c2",
    userName: "みお",
    avatar: "👩‍🦰",
    kind: "cook",
    text: "余り野菜でラタトゥイユ作った〜。色がきれい！",
    createdAt: minutesAgo(48),
    likes: 14,
  },
  {
    id: "c3",
    userName: "けんと",
    avatar: "🧑",
    kind: "levelup",
    text: "ついに「一人前の料理人」にレベルアップ 👨‍🍳",
    createdAt: minutesAgo(95),
    likes: 21,
  },
  {
    id: "c4",
    userName: "さくら",
    avatar: "🧕",
    kind: "zeroloss",
    text: "今週ロスゼロ達成！ +500XP もらった🏆",
    createdAt: minutesAgo(180),
    likes: 33,
  },
  {
    id: "c5",
    userName: "だいき",
    avatar: "🧑‍🎓",
    kind: "plan",
    text: "明日は¥390の野菜カレーを食べる予定。計画的にいくぞ",
    createdAt: minutesAgo(300),
    likes: 5,
  },
  {
    id: "c6",
    userName: "あや",
    avatar: "👩",
    kind: "cook",
    text: "肉じゃが、はじめてうまくできた…！自炊2週間続いてる",
    createdAt: minutesAgo(520),
    likes: 27,
  },
  {
    id: "c7",
    userName: "そうた",
    avatar: "🧑‍🔧",
    kind: "rescue",
    text: "冷凍庫の餃子で一食。買いすぎ防止できてる気がする",
    createdAt: minutesAgo(800),
    likes: 11,
  },
];

/** 自分の料理記録を投稿に変換 */
function selfPosts(): FeedPost[] {
  return getLogs().map((log) => ({
    id: `self-${log.id}`,
    userName: "あなた",
    avatar: "😋",
    kind: "cook",
    text: `「${log.dishName}」を作りました！`,
    photoUrl: log.photoUrl || undefined,
    createdAt: log.cookedAt,
    likes: 0,
    isSelf: true,
  }));
}

/** フィードを構築（自分＋コミュニティを新しい順に） */
export function buildFeed(): FeedPost[] {
  return [...selfPosts(), ...SAMPLE_COMMUNITY].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** 相対時刻（◯分前 / ◯時間前 / ◯日前） */
export function timeAgo(iso: string, now = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  return `${day}日前`;
}
