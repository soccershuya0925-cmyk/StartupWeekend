// ============================================================
// POST /api/receipt
// レシート画像（base64 data URL）を受け取り、GPT-4o Vision で
// 食材・数量・価格を解析して ReceiptItem[] を返す。
// OPENAI_API_KEY が未設定ならモックデータを返す（デモ用フォールバック）。
// ============================================================

import { NextResponse } from "next/server";
import type { ReceiptItem } from "@/types";

export const runtime = "nodejs";

// 精度重視のシステムプロンプト（略称・半角カナの正規化／非食品行の除外／全件抽出を明示）
const SYSTEM_PROMPT = `あなたは日本のスーパー・コンビニのレシート画像から「購入した食材・食品」だけを正確に抽出するアシスタントです。

出力は必ず次の形式の JSON オブジェクトのみ（前後に説明文やコードフェンスを付けない）:
{"items":[{"name":"トマト","quantity":3,"unit":"個","price":198,"category":"vegetable"}]}

抽出ルール:
- 食品・食材のみ抽出する。次のような食品でない行は必ず除外: 小計 / 合計 / 内税・外税 / 値引き・割引 / ポイント / お預り / お釣り / レジ袋・袋代 / 送料 / 店名・住所・電話番号・日付・レジ番号。
- レシートの略称・半角カナ・崩れた表記は、一般的な食品名にフルネームで正規化する（例: ﾄﾏﾄ→トマト、豚ﾊﾞﾗ→豚バラ肉、ｷｬﾍﾞﾂ→キャベツ、信州産ﾘﾝｺﾞ→りんご）。ブランド名・産地・特売表記は落とし、食材名そのものにする。
- quantity: 購入数（個数）。読み取れなければ 1。
- unit: 個 / 本 / 袋 / パック / 束 / g / ml など適切なもの。判断できなければ "点"。
- price: 税込価格（円）が読み取れれば整数で。読めなければ省略してよい。
- category: vegetable(野菜・果物) / meat(肉・魚・魚介) / dairy(乳製品・卵) / seasoning(調味料) / other(その他の食品)
- レシート上の食品は漏れなく全て含める。表記が不確実でも、最も近い一般的な食品名で含める。`;

const MOCK: ReceiptItem[] = [
  { name: "キャベツ", quantity: 1, unit: "個", price: 158, category: "vegetable" },
  { name: "トマト", quantity: 3, unit: "個", price: 198, category: "vegetable" },
  { name: "豚こま肉", quantity: 1, unit: "パック", price: 298, category: "meat" },
  { name: "卵", quantity: 1, unit: "パック", price: 218, category: "dairy" },
];

export async function POST(req: Request) {
  let imageDataUrl: string | undefined;
  try {
    const body = await req.json();
    imageDataUrl = body?.image;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    return NextResponse.json(
      { error: "image (base64 data URL) is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // --- フォールバック: APIキーが無ければモックを返す（デモが止まらない） ---
  if (!apiKey) {
    return NextResponse.json({ items: MOCK, mock: true });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        // 抽出タスクは決定的に。JSON を強制して構造の取りこぼしを防ぐ。
        temperature: 0,
        max_tokens: 3000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "このレシートを解析して、購入した食材を漏れなく抽出してください。",
              },
              {
                type: "image_url",
                // detail:high で小さな文字も読み取れるように
                image_url: { url: imageDataUrl, detail: "high" },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: "OpenAI API error", detail },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "{}";
    const items = parseItems(content);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: "request failed", detail: String(e) },
      { status: 500 }
    );
  }
}

/** 1件を ReceiptItem へ正規化（NFKC で半角カナ・全角数字を吸収） */
function normalizeItem(x: Record<string, unknown>): ReceiptItem {
  const name = String(x.name ?? "")
    .normalize("NFKC")
    .trim();
  const unit = String(x.unit ?? "点")
    .normalize("NFKC")
    .trim();
  const quantity = Number(x.quantity ?? 1) || 1;
  const priceNum = Number(x.price);
  const category = ["vegetable", "meat", "dairy", "seasoning", "other"].includes(
    x.category as string
  )
    ? (x.category as ReceiptItem["category"])
    : "other";
  return {
    name,
    quantity,
    unit: unit || "点",
    price: x.price != null && !Number.isNaN(priceNum) ? priceNum : undefined,
    category,
  };
}

/**
 * モデル出力から items を取り出す。
 * response_format:json_object なので通常は {"items":[...]} だが、
 * 配列やコードフェンス付きで返るケースもフォールバックで拾う。
 */
function parseItems(content: string): ReceiptItem[] {
  const toItems = (parsed: unknown): ReceiptItem[] => {
    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { items?: unknown })?.items)
      ? (parsed as { items: unknown[] }).items
      : [];
    return arr
      .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
      .map(normalizeItem)
      .filter((it) => it.name.length > 0);
  };

  try {
    return toItems(JSON.parse(content));
  } catch {
    // フォールバック: 本文中の JSON オブジェクト/配列を拾う
    const match = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return [];
    try {
      return toItems(JSON.parse(match[0]));
    } catch {
      return [];
    }
  }
}
