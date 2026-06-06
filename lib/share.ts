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

  // 背景グラデーション（ブランドグリーン）
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, "#2FBF5B");
  bg.addColorStop(1, "#1F9D55");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 装飾の半透明サークル
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(900, 200, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(160, 940, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";

  // ヘッダー
  ctx.fillStyle = "#F5B301";
  ctx.font = "700 34px system-ui, sans-serif";
  ctx.fillText("M E S H I K A T S U", cx, 130);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 72px system-ui, sans-serif";
  ctx.fillText("メシ活", cx, 210);

  // キャラクター（白丸＋絵文字）
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(cx, 440, 160, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "190px system-ui, sans-serif";
  ctx.fillText(data.emoji, cx, 505);

  // レベル・称号
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 60px system-ui, sans-serif";
  ctx.fillText(`Lv.${data.level} ${data.stageName}`, cx, 700);

  // 実績カード（3カラム）
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  roundRect(ctx, 90, 760, SIZE - 180, 170, 36);
  ctx.fill();

  const cols = [
    { label: "救った食材", value: `${data.savedCount}`, unit: "品" },
    { label: "節約できた額", value: `¥${data.savedYen.toLocaleString()}`, unit: "" },
    { label: "ロスゼロ継続", value: `${data.streakDays}`, unit: "日" },
  ];
  const colW = (SIZE - 180) / 3;
  cols.forEach((c, i) => {
    const x = 90 + colW * (i + 0.5);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.fillText(c.label, x, 818);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 56px system-ui, sans-serif";
    ctx.fillText(`${c.value}${c.unit}`, x, 885);
    // 区切り線
    if (i < cols.length - 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(90 + colW * (i + 1), 790);
      ctx.lineTo(90 + colW * (i + 1), 900);
      ctx.stroke();
    }
  });

  // ハッシュタグ
  ctx.fillStyle = "#F5B301";
  ctx.font = "700 40px system-ui, sans-serif";
  ctx.fillText("#メシ活  #食品ロスゼロ", cx, 1010);
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
