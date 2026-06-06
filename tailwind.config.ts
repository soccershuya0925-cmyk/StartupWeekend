import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        urgent: "#ef4444",
        warn:   "#f59e0b",
        safe:   "#22c55e",
        brand: {
          DEFAULT: "#2FBF5B",
          dark:    "#1F9D55",
          light:   "#E9F8EC",
        },
        accent: {
          DEFAULT: "#FF7A1A",
          dark:    "#FF6300",
          light:   "#FFE3C2",
        },
        gold:  "#F5B301",
        ink: {
          DEFAULT: "#3A2A1B",
          soft:    "#6F6457",
        },
        cream: "#FFF8EF",
      },
      fontFamily: {
        sans: [
          "var(--font-mplus)",
          "M PLUS Rounded 1c",
          "Hiragino Maru Gothic ProN",
          "Hiragino Kaku Gothic ProN",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        // カード系
        card:    "0 2px 12px -2px rgba(58,42,27,0.10), 0 0 0 1px rgba(58,42,27,0.04)",
        "card-md":"0 8px 24px -6px rgba(58,42,27,0.16), 0 0 0 1px rgba(58,42,27,0.04)",
        "card-lg":"0 16px 40px -8px rgba(58,42,27,0.20), 0 0 0 1px rgba(58,42,27,0.04)",
        float:   "0 20px 60px -12px rgba(58,42,27,0.28)",
        // グロー
        glow:         "0 8px 24px -4px rgba(47,191,91,0.50)",
        "glow-lg":    "0 12px 32px -4px rgba(47,191,91,0.65)",
        "glow-accent":"0 8px 24px -4px rgba(255,122,26,0.50)",
        "glow-gold":  "0 8px 24px -4px rgba(245,179,1,0.40)",
        // ナビ
        nav: "0 -4px 32px -4px rgba(58,42,27,0.10), 0 -1px 0 rgba(58,42,27,0.06)",
        // インセット
        "inset-brand": "inset 0 0 0 2px rgba(47,191,91,0.30)",
      },
      backgroundImage: {
        "brand-grad":  "linear-gradient(135deg, #2FBF5B 0%, #1F9D55 100%)",
        "accent-grad": "linear-gradient(135deg, #FF7A1A 0%, #FF6300 100%)",
        "warm-grad":   "linear-gradient(160deg, #FFE3C2 0%, #FFF8EF 50%, #E9F8EC 100%)",
        "hero-grad":   "linear-gradient(135deg, #FF7A1A 0%, #FF6300 60%, #2FBF5B 100%)",
        "dark-grad":   "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        "shimmer":     "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
      },
      keyframes: {
        // ページ入場
        "screen-in": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // カード・要素の出現
        "pop-in": {
          "0%":   { opacity: "0", transform: "scale(0.88) translateY(8px)" },
          "70%":  { transform: "scale(1.03)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        // スタンプ
        "stamp-in": {
          "0%":   { opacity: "0", transform: "scale(1.8) rotate(-12deg)" },
          "60%":  { transform: "scale(0.92) rotate(3deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0)" },
        },
        // XP獲得
        "xp-pop": {
          "0%":   { opacity: "0", transform: "translateY(10px) scale(0.8)" },
          "25%":  { opacity: "1", transform: "translateY(0) scale(1.15)" },
          "60%":  { opacity: "1", transform: "translateY(-10px) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-48px) scale(1)" },
        },
        // フロート
        "float": {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-7px)" },
        },
        // トースト
        "toast-in": {
          "0%":   { opacity: "0", transform: "translateY(-16px) scale(0.94)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // スライドアップ
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // シマー（ローディング）
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // グロー点滅（CTA）
        "glow-pulse": {
          "0%,100%": { boxShadow: "0 8px 24px -4px rgba(47,191,91,0.40)" },
          "50%":     { boxShadow: "0 8px 32px -2px rgba(47,191,91,0.70)" },
        },
        // バースト（コンフェッティ）
        "burst": {
          "0%":   { opacity: "0", transform: "scale(0.6)" },
          "30%":  { opacity: "1" },
          "100%": { opacity: "0", transform: "scale(1.8)" },
        },
        // アイテム削除
        "eaten": {
          "to": { opacity: "0", transform: "translateX(40px) scale(0.9)", maxHeight: "0", margin: "0", padding: "0" },
        },
        // パルスリング
        "pulse-ring": {
          "0%":   { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
      },
      animation: {
        "screen-in":  "screen-in 0.40s cubic-bezier(0.2,0.8,0.2,1) both",
        "pop-in":     "pop-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
        "stamp-in":   "stamp-in 0.50s cubic-bezier(0.34,1.56,0.64,1) both",
        "xp-pop":     "xp-pop 1.5s ease-out forwards",
        "float":      "float 3.5s ease-in-out infinite",
        "toast-in":   "toast-in 0.30s ease-out both",
        "slide-up":   "slide-up 0.45s ease-out both",
        "shimmer":    "shimmer 1.8s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2.2s ease-in-out infinite",
        "burst":      "burst 0.8s ease-out forwards",
        "eaten":      "eaten 0.4s ease forwards",
        "pulse-ring": "pulse-ring 1.2s ease-out infinite",
        // 旧名互換
        "float-slow": "float 3.5s ease-in-out infinite",
        "slide-up-old":"slide-up 0.45s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
