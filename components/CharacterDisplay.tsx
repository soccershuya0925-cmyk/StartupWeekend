"use client";

import { stageFromLevel } from "@/lib/xp";
import StageArt from "@/components/character/StageArt";

interface CharacterDisplayProps {
  level: number;
  /** 表示サイズ（lg=大きめ / md=小さめ） */
  size?: "md" | "lg";
  /** SVGアートの代わりに絵文字で表示する（軽量フォールバック） */
  emojiOnly?: boolean;
}

/** 現在レベルに対応するキャラクター（SVGアート＋名前）を表示 */
export default function CharacterDisplay({
  level,
  size = "lg",
  emojiOnly = false,
}: CharacterDisplayProps) {
  const stage = stageFromLevel(level);
  const artSize = size === "lg" ? 120 : 64;
  const emojiClass = size === "lg" ? "text-7xl" : "text-4xl";

  return (
    <div className="flex flex-col items-center">
      {emojiOnly ? (
        <div className={`${emojiClass} leading-none`} aria-hidden>
          {stage.emoji}
        </div>
      ) : (
        <StageArt stage={stage.stage} size={artSize} />
      )}
      <div className="mt-2 text-center">
        <p className="text-sm font-semibold text-slate-800">{stage.name}</p>
        <p className="text-xs text-slate-500">
          Lv.{level} ・ ステージ{stage.stage}
        </p>
      </div>
    </div>
  );
}
