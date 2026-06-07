// アプリ最上部の横長・小型 広告枠（バナー）。
// 全画面共通（app/layout.tsx で {children} の直前に配置）。
// 現在はプレースホルダー表示。実際の広告（例: Google AdSense）に差し替える手順は下記コメント参照。

export default function AdBanner() {
  return (
    <aside
      aria-label="広告"
      className="flex h-14 w-full shrink-0 items-center gap-2 border-b border-black/5 bg-white/80 px-3 backdrop-blur"
    >
      {/* 「広告」ラベル（景表法・ユーザー誤認防止のため明示） */}
      <span className="shrink-0 rounded bg-ink/10 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-ink-soft">
        広告
      </span>

      {/*
        === 実際の広告に差し替える場合（Google AdSense の例）===
        1) app/layout.tsx に AdSense スクリプトを読み込む:
             import Script from "next/script";
             <Script async strategy="afterInteractive"
               src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXX"
               crossOrigin="anonymous" />
        2) 下の placeholder <div> を次の <ins> に置き換え、"use client" + useEffect で push:
             <ins className="adsbygoogle" style={{ display: "block", width: "100%", height: 50 }}
               data-ad-client="ca-pub-XXXXXXXXXXXX" data-ad-slot="YYYYYYYYYY"
               data-ad-format="horizontal" data-full-width-responsive="true" />
             // useEffect(() => { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {} }, []);
        ※ 他の広告ネットワーク（nend / AdMob 等）でも、この枠（高さ約50px）に差し替えるだけ。
      */}
      <div className="flex h-9 flex-1 items-center justify-center rounded-md border border-dashed border-ink/20 bg-cream/60 text-[11px] font-bold text-ink-soft/70">
        広告スペース（ここに広告が表示されます）
      </div>
    </aside>
  );
}
