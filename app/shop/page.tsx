// ショップ（順次実装予定 / Coming Soon）
// 発表ではショップは「今後追加する機能」として見せる方針のため、
// 実機では Coming Soon プレースホルダーを表示する（価値は説明しつつ"近日公開"と明示）。
// ※ 静的表示のみ（クライアント機能なし）なのでサーバーコンポーネントのまま。

import Link from "next/link";

const PLANNED = [
  { emoji: "🍝", name: "パスタソース", note: "シェフ監修の冷凍ソース" },
  { emoji: "🍱", name: "冷凍弁当", note: "栄養バランス◎・¥390〜" },
  { emoji: "🥐", name: "パン", note: "朝の一枚をサッと" },
];

export default function ShopPage() {
  return (
    <main className="page">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent">SHOP</p>
          <h1 className="page-title">🛒 ショップ</h1>
          <p className="page-sub">足りない食材を¥390〜でワンタップ補充</p>
        </div>
        <div className="text-4xl" aria-hidden>
          🛒
        </div>
      </header>

      {/* Coming Soon ヒーロー */}
      <section className="mt-5 overflow-hidden rounded-4xl bg-gradient-to-br from-brand to-brand-dark p-7 text-center text-white shadow-glow">
        <div className="text-6xl" aria-hidden>
          🚧
        </div>
        <p className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-black tracking-wide">
          順次実装予定
        </p>
        <h2 className="mt-3 text-2xl font-black leading-snug">
          補充ショップは
          <br />
          近日公開予定です
        </h2>
        <p className="mx-auto mt-3 max-w-xs text-sm font-medium leading-relaxed text-white/85">
          在庫が少ない時に、足りない食材を <b>¥390〜でワンタップ補充</b>。買った食材はそのまま冷蔵庫に入り、「補充 → 使い切り」のループが回ります。
        </p>
      </section>

      {/* 提供予定のラインナップ */}
      <section className="mt-6">
        <h2 className="section-title">🗓 提供予定のラインナップ</h2>
        <ul className="space-y-2">
          {PLANNED.map((p) => (
            <li
              key={p.name}
              className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-card"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cream text-2xl"
                aria-hidden
              >
                {p.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-ink">{p.name}</p>
                <p className="text-xs text-ink-soft">{p.note}</p>
              </div>
              <span className="chip border-black/10 bg-cream text-ink-soft">準備中</span>
            </li>
          ))}
        </ul>
      </section>

      {/* いま使える機能への導線 */}
      <section className="mt-6">
        <div className="card-soft text-sm text-ink-soft">
          <p className="font-black text-ink">いまも使える機能</p>
          <p className="mt-1">
            冷蔵庫の見える化・期限アラート・レシピ提案・実績記録は今すぐお試しいただけます。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/fridge" className="btn-ghost">
              🧊 冷蔵庫を見る
            </Link>
            <Link href="/" className="btn-outline">
              ← ホーム
            </Link>
          </div>
        </div>
      </section>

      <p className="mb-2 mt-6 text-center text-[11px] text-ink-soft/70">
        ※ ショップ機能は今後のアップデートで追加予定です
      </p>
    </main>
  );
}
