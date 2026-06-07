import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Onboarding from "@/components/Onboarding";
import AdBanner from "@/components/AdBanner";

export const metadata: Metadata = {
  title: "メシ活 — 食品ロスゼロアプリ",
  description: "一人暮らし大学生の食品ロスをゼロにする、ゲーム感覚の食品管理アプリ",
  applicationName: "メシ活",
  appleWebApp: {
    capable: true,
    title: "メシ活",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#2FBF5B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-cream">
        {/* デスクトップでは中央のスマホ幅カラム。背景は温かいグラデーション */}
        <div className="app-shell relative mx-auto min-h-screen max-w-md bg-gradient-to-b from-accent-light/40 via-cream to-cream shadow-xl shadow-ink/5">
          {/* 最上部の横長・小型 広告枠（全画面共通） */}
          <AdBanner />
          {children}
        </div>
        <Navigation />
        {/* 初回起動時のチュートリアル（localStorage フラグで一度だけ） */}
        <Onboarding />
      </body>
    </html>
  );
}
