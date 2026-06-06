import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Onboarding from "@/components/Onboarding";

const mplus = M_PLUS_Rounded_1c({
  weight: ["400", "500", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mplus",
  preload: false,
});

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={mplus.variable}>
      <body className="bg-[#f0f2f5]">
        {/* デスクトップ：中央カラム＋温かいグラデーション背景 */}
        <div className="app-shell relative mx-auto min-h-screen max-w-md overflow-hidden shadow-float"
          style={{
            background: "linear-gradient(160deg, #FFE3C2 0%, #FFF8EF 40%, #EFF9F2 100%)",
          }}
        >
          {children}
        </div>
        <Navigation />
        <Onboarding />
      </body>
    </html>
  );
}
