"use client";

// ピッチスライド（/slides）— 発表用 web デッキ
// 5分ピッチ前提・1スライド1メッセージ・キーボード/ボタンで操作。
// ※ チーム単独スライドは入れない方針。ショップは「今後追加」のため資料から外す。
// ※ アンケート由来の数値は [アンケート速報] 表記。確定値に差し替えて使う。

import { useCallback, useEffect, useState } from "react";

/* ===== 円グラフ（CSS conic-gradient ドーナツ） ===== */
function Donut({
  value,
  color,
  label,
  sub,
}: {
  value: number;
  color: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-32 sm:h-40 sm:w-40">
        <div
          className="h-full w-full rounded-full"
          style={{
            background: `conic-gradient(${color} 0% ${value}%, #EFE3D3 ${value}% 100%)`,
          }}
        />
        <div className="absolute inset-[22%] grid place-items-center rounded-full bg-cream shadow-inner">
          <span className="text-2xl font-black text-ink sm:text-3xl">{value}%</span>
        </div>
      </div>
      <p className="mt-3 max-w-[12rem] text-center text-sm font-bold text-ink">{label}</p>
      {sub && <p className="text-center text-[11px] text-ink-soft">{sub}</p>}
    </div>
  );
}

/* ===== スライド共通の枠 ===== */
function Kicker({ children, color = "text-accent" }: { children: React.ReactNode; color?: string }) {
  return <p className={`text-xs font-black tracking-[0.2em] ${color}`}>{children}</p>;
}
function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-1 text-3xl font-black leading-tight text-ink sm:text-4xl">{children}</h2>;
}

/* ===== 各スライド ===== */
const SLIDES: { bg: string; render: () => React.ReactNode }[] = [
  // 1. 表紙 / Hook
  {
    bg: "bg-ink",
    render: () => (
      <div className="flex h-full flex-col justify-center px-8 text-white sm:px-16">
        <p className="text-sm font-black tracking-[0.3em] text-brand">MESHIKATSU ・ メシ活</p>
        <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
          冷蔵庫の奥で、
          <br />
          今日もキャベツが腐る。
        </h1>
        <p className="mt-5 text-lg font-bold text-cream sm:text-2xl">
          一人暮らしの「食」のムダを、まるごとゼロに。
        </p>
        <p className="mt-2 text-sm text-white/60 sm:text-base">
          入口は「手軽・安い・うまい」。気づけば食品ロスが消えている。
        </p>
        <div className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-brand/50 bg-white/5 px-4 py-2">
          <span className="text-sm font-black text-brand">● LIVE</span>
          <span className="text-sm font-bold">meshikatsu.vercel.app</span>
        </div>
      </div>
    ),
  },

  // 2. 課題 / Problem（エビデンス＋円グラフ）
  {
    bg: "bg-cream",
    render: () => (
      <div className="flex h-full flex-col justify-center px-8 sm:px-14">
        <Kicker>PROBLEM ・ 課題</Kicker>
        <Title>一人暮らしは「買う→腐らす→捨てる」の無限ループ</Title>
        <div className="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
          <ul className="space-y-3">
            {[
              ["買いすぎて腐らせる", "仕送りも使い切れず、気づけば期限切れ。"],
              ["自炊が続かない", "時間がない・面倒・洗い物地獄で3日で挫折。"],
              ["コンビニ頼みで高い", "毎日¥600〜。家計を圧迫、栄養も偏る。"],
            ].map(([t, b]) => (
              <li key={t} className="rounded-2xl border border-black/5 bg-white p-4 shadow-card">
                <p className="text-base font-black text-ink">{t}</p>
                <p className="mt-0.5 text-sm text-ink-soft">{b}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-col items-center gap-3">
            <Donut
              value={64}
              color="#FF7A1A"
              label="週1回以上、食材を捨てている"
              sub="一人暮らし大学生 [アンケート速報・N=○]"
            />
            <p className="rounded-xl bg-ink px-4 py-2 text-center text-sm font-bold text-white">
              一人暮らし大学生 <span className="text-gold">約150万人</span>
              <span className="text-white/60"> [出典確認]</span>
            </p>
          </div>
        </div>
        <p className="mt-5 text-center text-base font-black text-brand-dark sm:text-lg">
          病因は「料理ベタ」じゃない ―― “中身が見えない × いつ食べるか決まってない”。
        </p>
      </div>
    ),
  },

  // 3. 解決策 / Solution（把握→計画→補完＋キャラで続く）
  {
    bg: "bg-cream",
    render: () => (
      <div className="flex h-full flex-col justify-center px-8 sm:px-14">
        <Kicker>SOLUTION ・ 解決策</Kicker>
        <Title>見える化 → 計画 → 続く仕掛け</Title>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["1", "把握", "冷蔵庫を“期限ヤバい順”で見える化", "#FF7A1A"],
            ["2", "計画", "「いつ・どれだけ食べるか」を先に決定", "#2FBF5B"],
            ["3", "補完", "足りない分はレシート登録＆提案で即解決", "#E96400"],
          ].map(([n, t, b, c]) => (
            <div key={n} className="rounded-3xl border border-black/5 bg-white p-5 text-center shadow-card">
              <div
                className="mx-auto grid h-14 w-14 place-items-center rounded-full text-2xl font-black text-white"
                style={{ background: c as string }}
              >
                {n}
              </div>
              <p className="mt-3 text-lg font-black text-ink">{t}</p>
              <p className="mt-1 text-sm text-ink-soft">{b}</p>
            </div>
          ))}
        </div>
        {/* キャラがレベルアップ */}
        <div className="mt-6 rounded-3xl bg-gradient-to-r from-brand to-brand-dark p-5 text-white shadow-glow">
          <p className="text-sm font-black tracking-wide text-cream">＋ 続く仕掛け：投稿するほどキャラが育つ</p>
          <div className="mt-2 flex items-center justify-center gap-3 text-2xl sm:text-3xl">
            <span>🥚</span><span className="text-white/50">→</span>
            <span>🍳</span><span className="text-white/50">→</span>
            <span>👨‍🍳</span><span className="text-white/50">→</span>
            <span>🏆</span><span className="text-white/50">→</span>
            <span>⭐</span>
            <span className="ml-2 rounded-full bg-white/15 px-3 py-1 text-sm font-black">Lv.UP！</span>
          </div>
          <p className="mt-2 text-center text-sm text-cream/90">
            使い切る・記録するたびXP。ゲーム感覚だから“続く”＝食品ロスが「勝手に」減る。
          </p>
        </div>
      </div>
    ),
  },

  // 4. デモ / Demo
  {
    bg: "bg-cream",
    render: () => (
      <div className="flex h-full flex-col justify-center px-8 sm:px-14">
        <Kicker>DEMO ・ 実演</Kicker>
        <Title>動くMVP、今すぐスマホで</Title>
        <div className="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
          <ul className="space-y-2.5">
            {[
              "📷 レシートを撮るだけで食材を自動登録",
              "🧊 冷蔵庫を“期限ヤバい順”で見える化",
              "🍳 使える食材から旬レシピを提案",
              "🌱 救った量を g・¥・CO₂ で可視化",
              "⭐ 使うほどキャラが育つ（ゲーム感）",
            ].map((t) => (
              <li key={t} className="rounded-2xl border border-black/5 bg-white p-3.5 text-base font-bold text-ink shadow-card">
                {t}
              </li>
            ))}
          </ul>
          <div className="rounded-3xl bg-ink p-7 text-center text-white">
            <p className="text-sm font-black text-brand">● 公開中・誰でもアクセス可</p>
            <p className="mt-2 text-2xl font-black leading-tight">
              meshikatsu
              <br />
              .vercel.app
            </p>
            <div className="mx-auto mt-4 grid h-28 w-28 place-items-center rounded-2xl bg-white text-xs font-bold text-ink">
              QR
            </div>
            <p className="mt-2 text-xs text-white/60">スキャンして体験</p>
          </div>
        </div>
      </div>
    ),
  },

  // 5. 市場 / Market（ボトムアップ）
  {
    bg: "bg-cream",
    render: () => (
      <div className="flex h-full flex-col justify-center px-8 sm:px-14">
        <Kicker>MARKET ・ 市場</Kicker>
        <Title>市場は「積み上げ」で示す（ボトムアップ）</Title>
        <div className="mt-4 rounded-2xl border border-brand/40 bg-white px-5 py-3 text-center text-base font-black text-ink sm:text-lg">
          捨てられている食品ロス ＝ 150万人 × ¥6万/年 ＝{" "}
          <span className="text-brand-dark">約900億円/年</span>
          <span className="text-sm font-bold text-ink-soft"> [出典確認]</span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ["TAM", "≈ ¥700億/年", "一人暮らし大学生150万人 × 年¥47,000", "#FF7A1A"],
            ["SAM", "≈ ¥190億/年", "首都圏・関西 約40万人 [仮]", "#E96400"],
            ["SOM", "≈ ¥4.7億", "初年度 5校×2,000人 [仮]", "#178A47"],
          ].map(([tag, v, sub, c]) => (
            <div key={tag} className="rounded-2xl border border-black/5 bg-white p-4 text-center shadow-card">
              <p className="text-sm font-black tracking-widest" style={{ color: c as string }}>{tag}</p>
              <p className="mt-1 text-2xl font-black text-ink sm:text-3xl">{v}</p>
              <p className="mt-1 text-xs text-ink-soft">{sub}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-ink-soft">
          ¥47,000 = ¥390 × 3食/週 × 40週（年120食）。[仮] は検証で確定。
        </p>
      </div>
    ),
  },

  // 6. 収益 / Business Model
  {
    bg: "bg-cream",
    render: () => (
      <div className="flex h-full flex-col justify-center px-8 sm:px-14">
        <Kicker>MODEL ・ 稼ぎ方</Kicker>
        <Title>作らず・運ばず、既存をつなぐ「ハブ」</Title>
        <div className="mt-6 flex items-center justify-center gap-3 text-center">
          <div className="flex-1 rounded-2xl border border-black/5 bg-white p-4 shadow-card">
            <p className="text-sm font-black text-brand-dark">既存の供給</p>
            <p className="mt-1 text-xs text-ink-soft">コンビニ／冷凍食品／パン屋 等</p>
          </div>
          <span className="text-2xl font-black text-brand">→</span>
          <div className="flex-1 rounded-2xl bg-brand p-4 text-white shadow-glow">
            <p className="text-base font-black">アプリ＝ハブ</p>
            <p className="mt-1 text-xs text-cream">見える化・計画・提案</p>
          </div>
          <span className="text-2xl font-black text-brand">→</span>
          <div className="flex-1 rounded-2xl border border-black/5 bg-white p-4 shadow-card">
            <p className="text-sm font-black text-ink">一人暮らし大学生</p>
            <p className="mt-1 text-xs text-ink-soft">今日の一食が安く決まる</p>
          </div>
        </div>
        <div className="mt-6 rounded-3xl bg-brand-dark p-5 text-white">
          <p className="text-lg font-black">
            収益 ＝ 取引手数料（学生が払う一部を取り分・在庫ゼロの asset-light）
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["取り分", "≈¥120/食"],
              ["年間", "120食"],
              ["LTV", "¥14,400"],
              ["LTV:CAC", "≈ 9:1"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white/10 p-3 text-center">
                <p className="text-xs font-bold text-cream/80">{k}</p>
                <p className="text-xl font-black">{v}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-xs italic text-ink-soft">
          ※ 手数料率が最大の論点・要検証（一般に10〜30%）。将来：月額サブスク／大学・生協B2B2C。
        </p>
      </div>
    ),
  },

  // 7. トラクション / Traction（アンケート円グラフ）
  {
    bg: "bg-cream",
    render: () => (
      <div className="flex h-full flex-col justify-center px-8 sm:px-14">
        <Kicker>TRACTION ・ 現在地</Kicker>
        <Title>動くMVP ＋ 学生の声（検証中）</Title>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Donut value={86} color="#2FBF5B" label="課題に共感した" sub="[アンケート速報・N=○]" />
          <Donut value={72} color="#FF7A1A" label="1食¥390なら使いたい" sub="[アンケート速報・N=○]" />
          <Donut value={68} color="#E96400" label="使い続けたい" sub="[アンケート速報・N=○]" />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            "✅ 動くMVPを公開（誰でもアクセス可）",
            "✅ 学生インタビュー＆アンケート実施中",
            "✅ キャラ育成で“続く”手応え",
          ].map((t) => (
            <span key={t} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink shadow-card">
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
  },

  // 8. Why Now / Vision
  {
    bg: "bg-cream",
    render: () => (
      <div className="flex h-full flex-col justify-center px-8 sm:px-14">
        <Kicker>WHY NOW ・ なぜ今</Kicker>
        <Title>今やる必然性と、その先</Title>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["💸 物価高", "学生の食費負担が過去最高水準。節約ニーズが切実に。"],
            ["🧊 冷凍食品の進化", "“安い・うまい・日持ち”が当たり前に。束ねる価値が出た。"],
            ["🌍 Z世代のサステナ意識", "「ムダにしたくない」が自然な動機に。"],
            ["📱 スマホ前提世代", "レシート撮影・アプリ管理が無理なく続く。"],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border border-black/5 bg-white p-4 shadow-card">
              <p className="text-base font-black text-ink">{t}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{b}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-lg font-black text-brand-dark">
          一人暮らし大学生から始め、単身世帯・地方へ。<br className="sm:hidden" />
          “捨てるはずだった食材を、今日のごはんに。”
        </p>
      </div>
    ),
  },

  // 9. 締め
  {
    bg: "bg-ink",
    render: () => (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center text-white">
        <p className="text-sm font-black tracking-[0.3em] text-brand">MESHIKATSU ・ メシ活</p>
        <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">
          ご清聴
          <br className="sm:hidden" />
          ありがとうございました
        </h1>
        <p className="mt-5 text-lg font-bold text-cream">
          “捨てるはずだった食材を、今日のごはんに。”
        </p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand/50 bg-white/5 px-5 py-2.5">
          <span className="text-sm font-black text-brand">● LIVE</span>
          <span className="text-base font-bold">meshikatsu.vercel.app</span>
        </div>
      </div>
    ),
  },
];

export default function SlidesPage() {
  const [i, setI] = useState(0);
  const total = SLIDES.length;

  const next = useCallback(() => setI((v) => Math.min(total - 1, v + 1)), [total]);
  const prev = useCallback(() => setI((v) => Math.max(0, v - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const slide = SLIDES[i];

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${slide.bg}`}>
      {/* スライド本体（クリックで左=戻る/右=進む） */}
      <div className="relative flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-5xl">{slide.render()}</div>
        {/* クリックゾーン（プレゼン操作） */}
        <button
          type="button"
          aria-label="前のスライド"
          onClick={prev}
          className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize bg-transparent"
        />
        <button
          type="button"
          aria-label="次のスライド"
          onClick={next}
          className="absolute inset-y-0 right-0 w-1/4 cursor-e-resize bg-transparent"
        />
      </div>

      {/* 下部コントロール */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={prev}
          disabled={i === 0}
          className="rounded-full bg-black/20 px-4 py-2 text-sm font-black text-white backdrop-blur disabled:opacity-30"
        >
          ◀
        </button>

        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, n) => (
            <button
              key={n}
              type="button"
              aria-label={`スライド${n + 1}へ`}
              onClick={() => setI(n)}
              className={`h-2 rounded-full transition-all ${
                n === i ? "w-6 bg-brand" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-white/70 mix-blend-difference">
            {i + 1} / {total}
          </span>
          <button
            type="button"
            onClick={next}
            disabled={i === total - 1}
            className="rounded-full bg-brand px-4 py-2 text-sm font-black text-white disabled:opacity-30"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
