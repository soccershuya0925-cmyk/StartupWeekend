"use client";

// ============================================================
// ③ キャラクターアート（5段階）
// 事業計画書 §3 機能④のキャラ成長を、絵文字より一段リッチな
// インラインSVGで表現する。lib/xp.ts の STAGES（stage 1〜5）に対応。
// 配色は docs/design/UX-VISUAL.md のブランドパレットに準拠。
// ============================================================

// ブランドパレット（HTML版と統一＝折衷案でも色がぶれない）
const C = {
  shell: "#FFF1DD", // 卵・体のベース（クリーム）
  shellEdge: "#F2D9B6",
  hat: "#FFFFFF", // コック帽
  hatBand: "#2FBF5B", // brand-green
  face: "#3A2A1B", // ink（目・口）
  cheek: "#FF9E6B",
  orange: "#FF7A1A", // brand-orange（アクセント）
  green: "#2FBF5B",
  gold: "#F5B301", // トロフィー・スター
  glow: "#FFE9A8",
};

interface StageArtProps {
  stage: number; // 1〜5
  /** 表示サイズ(px) */
  size?: number;
  className?: string;
}

/** ステージ番号に応じたキャラSVGを返す（1〜5、範囲外は1にクランプ） */
export default function StageArt({ stage, size = 120, className }: StageArtProps) {
  const s = Math.min(5, Math.max(1, Math.round(stage)));
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`キャラクター ステージ${s}`}
    >
      {/* ステージ5: 後光 */}
      {s >= 5 && <circle cx="50" cy="52" r="46" fill={C.glow} opacity="0.45" />}

      {/* 体（卵型ベース・全ステージ共通） */}
      <ellipse cx="50" cy="60" rx="28" ry="30" fill={C.shell} stroke={C.shellEdge} strokeWidth="2" />

      {/* ステージ2: 殻のヒビ（孵化中） */}
      {s === 2 && (
        <path d="M30 52 l6 4 l-5 4 l7 3" fill="none" stroke={C.shellEdge} strokeWidth="2" strokeLinecap="round" />
      )}

      {/* 顔: 目 */}
      <circle cx="42" cy="58" r="3" fill={C.face} />
      <circle cx="58" cy="58" r="3" fill={C.face} />
      {/* 目のハイライト */}
      <circle cx="43" cy="57" r="1" fill="#fff" />
      <circle cx="59" cy="57" r="1" fill="#fff" />
      {/* ほっぺ */}
      <circle cx="36" cy="64" r="3" fill={C.cheek} opacity="0.7" />
      <circle cx="64" cy="64" r="3" fill={C.cheek} opacity="0.7" />
      {/* 口（ステージが上がるほど自信のある笑顔） */}
      <path
        d={s >= 3 ? "M44 66 q6 6 12 0" : "M45 66 q5 4 10 0"}
        fill="none"
        stroke={C.face}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* コック帽（ステージ2以降で出現、上がるほど大きく） */}
      {s >= 2 && (
        <g>
          {/* 帽子本体 */}
          <ellipse cx="50" cy={28 - (s - 2)} rx={14 + (s - 2) * 1.5} ry={9 + (s - 2)} fill={C.hat} stroke={C.shellEdge} strokeWidth="1.5" />
          <circle cx={40 - (s - 2)} cy={30 - (s - 2)} r={6 + (s - 2)} fill={C.hat} stroke={C.shellEdge} strokeWidth="1.5" />
          <circle cx={60 + (s - 2)} cy={30 - (s - 2)} r={6 + (s - 2)} fill={C.hat} stroke={C.shellEdge} strokeWidth="1.5" />
          {/* 帽子の土台 */}
          <rect x="34" y="34" width="32" height="8" rx="3" fill={C.hat} stroke={C.shellEdge} strokeWidth="1.5" />
          {/* バンド（緑） */}
          <rect x="34" y="38" width="32" height="3" fill={C.hatBand} opacity="0.85" />
        </g>
      )}

      {/* ステージ1: 帽子の代わりに小さな芽（生まれたて） */}
      {s === 1 && (
        <g>
          <path d="M50 32 q-6 -8 0 -12 q6 4 0 12" fill={C.green} />
          <line x1="50" y1="32" x2="50" y2="30" stroke={C.green} strokeWidth="2" />
        </g>
      )}

      {/* ステージ4: トロフィー（左手側） */}
      {s >= 4 && (
        <g>
          <rect x="16" y="70" width="12" height="4" rx="1" fill={C.gold} />
          <rect x="20" y="60" width="4" height="10" fill={C.gold} />
          <path d="M16 52 h12 v3 a6 6 0 0 1 -12 0 z" fill={C.gold} />
        </g>
      )}

      {/* ステージ5: スター＆きらめき（神様） */}
      {s >= 5 && (
        <g fill={C.gold}>
          <path d="M50 8 l2.2 4.6 l5 .7 l-3.6 3.5 l.9 5 l-4.5 -2.4 l-4.5 2.4 l.9 -5 l-3.6 -3.5 l5 -.7 z" />
          <circle cx="20" cy="30" r="1.6" />
          <circle cx="82" cy="34" r="2" />
          <circle cx="78" cy="68" r="1.6" />
          <circle cx="22" cy="60" r="1.4" />
        </g>
      )}
    </svg>
  );
}
