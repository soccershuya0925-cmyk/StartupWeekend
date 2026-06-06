"use client";

import { useEffect, useRef, useState } from "react";
import { drawShareCard, shareOrDownload, type ShareData } from "@/lib/share";

interface ShareCardProps {
  data: ShareData;
}

/**
 * 実績シェアカード。1080×1080 の canvas に実績を描画してプレビューし、
 * Web Share API（対応端末）または画像ダウンロードで共有する。
 */
export default function ShareCard({ data }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  // プレビュー用に表示 canvas へ描画（CSS で縮小表示）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) drawShareCard(ctx, data);
  }, [data]);

  async function handleShare() {
    setBusy(true);
    setNote(null);
    try {
      const result = await shareOrDownload(data);
      setNote(result === "shared" ? "シェアしました！" : "画像を保存しました📥");
    } catch {
      setNote("画像の生成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-card">
      <canvas
        ref={canvasRef}
        width={1080}
        height={1080}
        className="w-full rounded-2xl"
        aria-label="シェア用の実績カード"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          className="btn-primary flex-1"
        >
          {busy ? "生成中…" : "📣 シェア / 画像を保存"}
        </button>
      </div>
      {note && (
        <p className="mt-2 text-center text-xs font-semibold text-brand">{note}</p>
      )}
      <p className="mt-1 text-center text-[11px] text-ink-soft">
        対応端末ではそのままSNSへ。非対応ならPNG画像として保存されます。
      </p>
    </div>
  );
}
