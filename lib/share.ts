// ============================================================
// SNSシェア画像生成（Canvas でクライアント側生成・バックエンド/課金なし）
// 実績（レベル・節約額・救った品数・継続日数）を1枚のカード画像にする。
// ============================================================

export interface ShareData {
  level: number;
  stageName: string;
  emoji: string;
  savedCount: number;
  savedYen: number;
  streakDays: number;
  /** 影響力称号（lib/influence.ts） */
  influenceTitle?: string;
  influenceEmoji?: string;
  influenceScore?: number;
}

const SIZE = 1080; // 正方形（Instagram/各SNS向け）

/** 角丸矩形のパスを切る */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** シェアカードを ctx に描画する（SIZE×SIZE 前提） */
export function drawShareCard(ctx: CanvasRenderingContext2D, data: ShareData) {
  const cx = SIZE / 2;

  // 背景グラデーション（称号があれば格調あるダーク調、なければブランドグリーン）
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  if (data.influenceTitle) {
    bg.addColorStop(0, "#1a1a2e");
    bg.addColorStop(0.5, "#16213e");
    bg.addColorStop(1, "#0f3460");
  } else {
    bg.addColorStop(0, "#2FBF5B");
    bg.addColorStop(1, "#1F9D55");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 装飾の輝きサークル
  const glowColor = data.influenceTitle ? "rgba(245,179,1,0.1)" : "rgba(255,255,255,0.08)";
  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.arc(900, 200, 300, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(160, 940, 240, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";

  // ヘッダー
  ctx.fillStyle = "#F5B301";
  ctx.font = "700 34px system-ui, sans-serif";
  ctx.fillText("M E S H I K A T S U", cx, 100);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 56px system-ui, sans-serif";
  ctx.fillText("メシ活", cx, 168);

  // 影響力称号（あれば大きく）
  if (data.influenceTitle && data.influenceEmoji) {
    // 称号の台座
    ctx.fillStyle = "rgba(245,179,1,0.15)";
    roundRect(ctx, 80, 200, SIZE - 160, 130, 40);
    ctx.fill();
    ctx.strokeStyle = "rgba(245,179,1,0.5)";
    ctx.lineWidth = 2;
    roundRect(ctx, 80, 200, SIZE - 160, 130, 40);
    ctx.stroke();

    ctx.font = "900 80px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(data.influenceEmoji, cx, 285);

    ctx.font = "900 52px system-ui, sans-serif";
    ctx.fillStyle = "#F5B301";
    ctx.fillText(data.influenceTitle, cx, 355);

    if (data.influenceScore !== undefined) {
      ctx.font = "700 30px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(`影響力スコア: ${data.influenceScore}`, cx, 400);
    }
  }

  // キャラクター絵文字
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.arc(cx, data.influenceTitle ? 560 : 440, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "160px system-ui, sans-serif";
  ctx.fillText(data.emoji, cx, data.influenceTitle ? 615 : 495);

  // Lv + キャラ称号（小さめ）
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "700 38px system-ui, sans-serif";
  ctx.fillText(`Lv.${data.level}  ${data.stageName}`, cx, data.influenceTitle ? 700 : 620);

  // 実績カード（3カラム）
  const cardY = data.influenceTitle ? 740 : 680;
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  roundRect(ctx, 80, cardY, SIZE - 160, 180, 36);
  ctx.fill();

  const cols = [
    { label: "救った食材", value: `${data.savedCount}`, unit: "品" },
    { label: "節約できた額", value: `¥${data.savedYen.toLocaleString()}`, unit: "" },
    { label: "ロスゼロ継続", value: `${data.streakDays}`, unit: "日" },
  ];
  const colW = (SIZE - 160) / 3;
  cols.forEach((c, i) => {
    const x = 80 + colW * (i + 0.5);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText(c.label, x, cardY + 55);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 54px system-ui, sans-serif";
    ctx.fillText(`${c.value}${c.unit}`, x, cardY + 125);
    if (i < cols.length - 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80 + colW * (i + 1), cardY + 30);
      ctx.lineTo(80 + colW * (i + 1), cardY + 150);
      ctx.stroke();
    }
  });

  // ハッシュタグ
  ctx.fillStyle = "#F5B301";
  ctx.font = "700 36px system-ui, sans-serif";
  ctx.fillText("#メシ活  #食品ロスゼロ  #料理インフルエンサー", cx, 1010);
}

/** ShareData からカード画像の Blob を生成する */
export function renderShareBlob(data: ShareData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("canvas 2d context が取得できません"));
    drawShareCard(ctx, data);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("画像の生成に失敗しました"));
    }, "image/png");
  });
}

/** シェア文言 */
export const SHARE_TEXT = "メシ活で食品ロスゼロに挑戦中！ #メシ活 #食品ロスゼロ";

/**
 * 生成した画像をシェア（Web Share API 対応端末）または保存する。
 * 戻り値: "shared" | "downloaded"
 */
export async function shareOrDownload(data: ShareData): Promise<"shared" | "downloaded"> {
  const blob = await renderShareBlob(data);
  const file = new File([blob], "meshikatsu.png", { type: "image/png" });

  // Web Share API（モバイルのファイル共有）が使えれば優先
  const nav = navigator as Navigator & {
    canShare?: (data?: { files?: File[] }) => boolean;
  };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: SHARE_TEXT });
      return "shared";
    } catch {
      // ユーザーキャンセル等 → ダウンロードにフォールバック
    }
  }

  // フォールバック: ダウンロード
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "meshikatsu.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}
