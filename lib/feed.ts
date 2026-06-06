// ============================================================
// SNSフィード — コミュニティデモ投稿
// getCommunityPosts() は呼ぶたびに「今から相対的な日時」で生成する
// ============================================================

import type { FeedPost, PostComment } from "@/types";

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

const H = 3_600_000;
const D = 86_400_000;

function comment(
  postId: string,
  id: string,
  name: string,
  avatar: string,
  text: string,
  msAgo: number
): PostComment {
  return { id, postId, authorName: name, authorAvatar: avatar, text, at: ago(msAgo) };
}

export function getCommunityPosts(): FeedPost[] {
  return [
    {
      id: "demo-1",
      authorId: "user-tanaka",
      authorName: "田中航",
      authorAvatar: "🧑‍🍳",
      dishName: "肉じゃが",
      photoUrl: "",
      photoEmoji: "🍲",
      caption: "初めて肉じゃが作った！形は崩れたけど味は最高だった🔥 じゃがいもが売れ残ってたから活用できてよかった",
      postedAt: ago(1.5 * H),
      baseLikes: 132,
      baseStars: 4.8,
      baseComments: [
        comment("demo-1", "c1-1", "鈴木彩", "👩", "おいしそう！写真上げてほしい✨", 1 * H),
        comment("demo-1", "c1-2", "山田翔", "🧑", "肉じゃが崩れても味さえよければOKw", 50 * 60 * 1000),
        comment("demo-1", "c1-3", "佐藤萌", "👧", "次回は動画でみたい！", 20 * 60 * 1000),
      ],
    },
    {
      id: "demo-2",
      authorId: "user-suzuki",
      authorName: "鈴木彩",
      authorAvatar: "👩",
      dishName: "回鍋肉",
      photoUrl: "",
      photoEmoji: "🥬",
      caption: "キャベツが余ってたから回鍋肉にしてみた。豆板醤の量は加減が難しい…でも美味しかった！",
      postedAt: ago(4 * H),
      baseLikes: 89,
      baseStars: 4.5,
      baseComments: [
        comment("demo-2", "c2-1", "高橋健", "👨", "豆板醤多めがうまいよ！", 3.5 * H),
        comment("demo-2", "c2-2", "伊藤りな", "👱‍♀️", "食品ロス回避えらい！", 2 * H),
      ],
    },
    {
      id: "demo-3",
      authorId: "user-yamada",
      authorName: "山田翔",
      authorAvatar: "🧑",
      dishName: "自家製ラーメン",
      photoUrl: "",
      photoEmoji: "🍜",
      caption: "鶏ガラからスープ作った。6時間煮込みで超濃厚！チャーシューも手作りで今まで食べた中で1番うまかった",
      postedAt: ago(8 * H),
      baseLikes: 201,
      baseStars: 4.9,
      baseComments: [
        comment("demo-3", "c3-1", "田中航", "🧑‍🍳", "これは本格的すぎる…！レシピ教えて", 7 * H),
        comment("demo-3", "c3-2", "渡辺誠", "🧔", "チャーシューまで手作りはすごい", 6 * H),
        comment("demo-3", "c3-3", "中村花", "👩‍🦱", "絶対食べたい…近所に住みたい笑", 5 * H),
        comment("demo-3", "c3-4", "加藤京", "👩‍🍳", "スープの透明感が美しい！", 3 * H),
      ],
    },
    {
      id: "demo-4",
      authorId: "user-sato",
      authorName: "佐藤萌",
      authorAvatar: "👧",
      dishName: "カルボナーラ",
      photoUrl: "",
      photoEmoji: "🍝",
      caption: "生クリーム使わずに本場スタイルで作ってみた。卵が固まりかけてヒヤッとしたけど成功！😭",
      postedAt: ago(1 * D),
      baseLikes: 76,
      baseStars: 4.3,
      baseComments: [
        comment("demo-4", "c4-1", "田中航", "🧑‍🍳", "卵固まりあるあるw 湯切り直後が勝負", 23 * H),
        comment("demo-4", "c4-2", "伊藤りな", "👱‍♀️", "本場スタイルかっこいい！", 20 * H),
      ],
    },
    {
      id: "demo-5",
      authorId: "user-takahashi",
      authorName: "高橋健",
      authorAvatar: "👨",
      dishName: "パラパラチャーハン",
      photoUrl: "",
      photoEmoji: "🍚",
      caption: "ついにパラパラチャーハンの極意を掴んだ。冷やご飯＋強火＋卵先入れ。シンプルだけど奥が深い",
      postedAt: ago(1 * D + 3 * H),
      baseLikes: 115,
      baseStars: 4.7,
      baseComments: [
        comment("demo-5", "c5-1", "山田翔", "🧑", "卵先入れ派！自分もそうしてる", 1 * D + 2 * H),
        comment("demo-5", "c5-2", "小林大地", "🧑‍🦱", "冷やご飯大事すぎる", 1 * D + H),
      ],
    },
    {
      id: "demo-6",
      authorId: "user-ito",
      authorName: "伊藤りな",
      authorAvatar: "👱‍♀️",
      dishName: "彩りお弁当",
      photoUrl: "",
      photoEmoji: "🍱",
      caption: "今日から毎日お弁当チャレンジ始めた！赤黄緑のバランス意識してみた。食費も1日500円以内に抑えられてる",
      postedAt: ago(2 * D),
      baseLikes: 98,
      baseStars: 4.6,
      baseComments: [
        comment("demo-6", "c6-1", "鈴木彩", "👩", "毎日すごい！継続してほしい", 1 * D + 22 * H),
        comment("demo-6", "c6-2", "佐藤萌", "👧", "500円でこのクオリティは神", 1 * D + 18 * H),
        comment("demo-6", "c6-3", "中村花", "👩‍🦱", "レシピ教えてほしい！", 1 * D + 10 * H),
      ],
    },
    {
      id: "demo-7",
      authorId: "user-watanabe",
      authorName: "渡辺誠",
      authorAvatar: "🧔",
      dishName: "本格麻婆豆腐",
      photoUrl: "",
      photoEmoji: "🌶️",
      caption: "市販ルー使わず花椒と豆板醤から作った麻婆豆腐。辛さと痺れが本物。ご飯3杯いけた",
      postedAt: ago(2 * D + 6 * H),
      baseLikes: 143,
      baseStars: 4.9,
      baseComments: [
        comment("demo-7", "c7-1", "加藤京", "👩‍🍳", "花椒から作るとか本格すぎる！", 2 * D + 5 * H),
        comment("demo-7", "c7-2", "田中航", "🧑‍🍳", "ご飯3杯は正義", 2 * D + 3 * H),
      ],
    },
    {
      id: "demo-8",
      authorId: "user-nakamura",
      authorName: "中村花",
      authorAvatar: "👩‍🦱",
      dishName: "ハート文字オムライス",
      photoUrl: "",
      photoEmoji: "🍳",
      caption: "ケチャップでハート書く練習中。5回目でやっと綺麗にできた💕 チキンライスは先週より確実にうまくなってる",
      postedAt: ago(3 * D),
      baseLikes: 167,
      baseStars: 4.7,
      baseComments: [
        comment("demo-8", "c8-1", "伊藤りな", "👱‍♀️", "可愛すぎる！！", 2 * D + 22 * H),
        comment("demo-8", "c8-2", "佐藤萌", "👧", "成長が見える投稿いいな〜", 2 * D + 20 * H),
        comment("demo-8", "c8-3", "高橋健", "👨", "センスある", 2 * D + 15 * H),
      ],
    },
    {
      id: "demo-9",
      authorId: "user-kobayashi",
      authorName: "小林大地",
      authorAvatar: "🧑‍🦱",
      dishName: "豚汁",
      photoUrl: "",
      photoEmoji: "🍵",
      caption: "豚汁って最強の料理だと思う。安くて、簡単で、めちゃうまい。冷蔵庫の残り野菜全部入れても美味しくなるし",
      postedAt: ago(3 * D + 8 * H),
      baseLikes: 84,
      baseStars: 4.5,
      baseComments: [
        comment("demo-9", "c9-1", "渡辺誠", "🧔", "完全同意。最強の家庭料理", 3 * D + 7 * H),
        comment("demo-9", "c9-2", "田中航", "🧑‍🍳", "里芋入れると最高になるよ", 3 * D + 5 * H),
      ],
    },
    {
      id: "demo-10",
      authorId: "user-kato",
      authorName: "加藤京",
      authorAvatar: "👩‍🍳",
      dishName: "スパイスカレー",
      photoUrl: "",
      photoEmoji: "🍛",
      caption: "クミン・コリアンダー・カルダモンなど8種のスパイスから作るカレーに初挑戦。市販ルーとは別次元の深みが出た✨",
      postedAt: ago(4 * D),
      baseLikes: 189,
      baseStars: 5.0,
      baseComments: [
        comment("demo-10", "c10-1", "山田翔", "🧑", "スパイス8種！本格すぎる", 3 * D + 23 * H),
        comment("demo-10", "c10-2", "鈴木彩", "👩", "絶対美味しいやつ。レシピ公開して！", 3 * D + 20 * H),
        comment("demo-10", "c10-3", "小林大地", "🧑‍🦱", "カルダモンって何で手に入る？", 3 * D + 18 * H),
        comment("demo-10", "c10-4", "渡辺誠", "🧔", "カレー界の沼にようこそ笑", 3 * D + 12 * H),
      ],
    },
  ];
}

/** 自分のCookingLogをFeedPost形式に変換 */
import type { CookingLog } from "@/types";

export function logToFeedPost(log: CookingLog): FeedPost {
  return {
    id: `my-${log.id}`,
    authorId: "me",
    authorName: "あなた",
    authorAvatar: "😊",
    dishName: log.dishName,
    photoUrl: log.photoUrl,
    photoEmoji: "🍽️",
    caption: log.caption || "",
    postedAt: log.cookedAt,
    baseLikes: 0,
    baseStars: 0,
    baseComments: [],
  };
}

/** コミュニティ投稿 + 自分の投稿を日付降順でマージ */
export function buildFeed(logs: CookingLog[]): FeedPost[] {
  const community = getCommunityPosts();
  const mine = logs.map(logToFeedPost);
  return [...community, ...mine].sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );
}
