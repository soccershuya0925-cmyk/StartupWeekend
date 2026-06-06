// ============================================================
// 影響力システム（料理インフルエンサー称号）
// 料理記録・SNSシェア・食品ロス削減の積み重ねで「格」が上がる。
// シェアするほどスコアが伸びる設計 → SNS拡散のループを作る。
// ============================================================

export interface InfluenceTitle {
  stage: number;    // 1〜6
  title: string;
  emoji: string;
  description: string;
  minScore: number;
  /** 次のランクへの道しるべ */
  hint: string;
}

export interface InfluenceScore {
  total: number;
  breakdown: {
    fromCooks: number;
    fromShares: number;
    fromSaved: number;
    fromStreak: number;
  };
}

/** 称号テーブル（minScore 昇順） */
export const INFLUENCE_TITLES: InfluenceTitle[] = [
  {
    stage: 1,
    title: "見習いシェフの卵",
    emoji: "🥚",
    description: "料理の一歩を踏み出した",
    minScore: 0,
    hint: "まずは料理を3回記録してみよう",
  },
  {
    stage: 2,
    title: "自炊インフルエンサー見習い",
    emoji: "🍳",
    description: "少しずつ発信を始めている",
    minScore: 20,
    hint: "実績をシェアすると影響力が一気に上がる！",
  },
  {
    stage: 3,
    title: "食品ロスファイター",
    emoji: "📱",
    description: "ロス削減を発信中。フォロワーが増えてきた",
    minScore: 50,
    hint: "シェアを重ねてさらに上を目指そう",
  },
  {
    stage: 4,
    title: "料理クリエイター",
    emoji: "🎬",
    description: "料理コンテンツで多くの人を動かしている",
    minScore: 100,
    hint: "食品ロスゼロ継続でスコアが加速する",
  },
  {
    stage: 5,
    title: "食育インフルエンサー",
    emoji: "⭐",
    description: "料理で社会を変えるリーダー",
    minScore: 180,
    hint: "あなたの発信が食品ロスを減らしている",
  },
  {
    stage: 6,
    title: "伝説の料理神",
    emoji: "👑",
    description: "料理界のレジェンド。誰もが憧れる存在",
    minScore: 300,
    hint: "最高ランク達成！あとはシェアして仲間を増やそう",
  },
];

/**
 * 影響力スコアを計算する。
 * - シェアを一番重く設定 → 「シェアするほど格が上がる」ループ
 */
export function computeInfluenceScore(params: {
  cookCount: number;
  shareCount: number;
  savedCount: number;
  streakDays: number;
}): InfluenceScore {
  const fromCooks = params.cookCount * 3;
  const fromShares = params.shareCount * 20; // シェアが最高効率
  const fromSaved = params.savedCount * 2;
  const fromStreak = params.streakDays * 2;
  return {
    total: fromCooks + fromShares + fromSaved + fromStreak,
    breakdown: { fromCooks, fromShares, fromSaved, fromStreak },
  };
}

/** スコアから称号を返す */
export function titleFromScore(score: number): InfluenceTitle {
  let title = INFLUENCE_TITLES[0];
  for (const t of INFLUENCE_TITLES) {
    if (score >= t.minScore) title = t;
  }
  return title;
}

/** 次の称号と、そこまでに必要なスコアを返す（最高ランクなら null） */
export function nextTitle(score: number): { title: InfluenceTitle; needed: number } | null {
  for (const t of INFLUENCE_TITLES) {
    if (score < t.minScore) {
      return { title: t, needed: t.minScore - score };
    }
  }
  return null;
}
