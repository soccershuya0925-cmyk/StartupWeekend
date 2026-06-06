"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/",          label: "ホーム",    icon: "🏠" },
  { href: "/fridge",    label: "冷蔵庫",    icon: "🧊" },
  { href: "/shop",      label: "ショップ",  icon: "🛒" },
  { href: "/cook",      label: "投稿",      icon: "✚",  post: true },
  { href: "/recipe",    label: "レシピ",    icon: "📖" },
  { href: "/character", label: "キャラ",    icon: "⭐" },
  { href: "/profile",   label: "マイページ", icon: "👤" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-md">
        {/* フロストガラスバー */}
        <div
          className="relative px-1 shadow-nav"
          style={{
            background: "rgba(255,252,248,0.82)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderTop: "1px solid rgba(255,255,255,0.7)",
          }}
        >
          {/* グラデーションライン */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(47,191,91,0.4) 30%, rgba(255,122,26,0.4) 70%, transparent)" }}
          />

          <ul
            className="flex items-center justify-around"
            style={{ paddingBottom: "env(safe-area-inset-bottom)", height: 58 }}
          >
            {TABS.map((tab) => {
              const active =
                tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

              if (tab.post) {
                /* 投稿ボタン：常にグラデーション円 */
                return (
                  <li key={tab.href} className="flex flex-1 justify-center">
                    <Link
                      href={tab.href}
                      aria-current={active ? "page" : undefined}
                      className="flex flex-col items-center gap-0.5"
                    >
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-white transition-transform active:scale-90"
                        style={{
                          background: "linear-gradient(135deg, #2FBF5B 0%, #FF7A1A 100%)",
                          boxShadow: active
                            ? "0 6px 20px -4px rgba(47,191,91,0.65)"
                            : "0 4px 14px -4px rgba(47,191,91,0.45)",
                        }}
                      >
                        {tab.icon}
                      </span>
                      <span
                        className="text-[9px] font-black"
                        style={{ color: active ? "#2FBF5B" : "#9CA3AF" }}
                      >
                        {tab.label}
                      </span>
                    </Link>
                  </li>
                );
              }

              return (
                <li key={tab.href} className="flex flex-1 justify-center">
                  <Link
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className="flex flex-col items-center gap-0.5 transition-all"
                  >
                    <span
                      className="flex h-7 w-8 items-center justify-center rounded-xl text-[17px] transition-all duration-200"
                      style={
                        active
                          ? {
                              background: "linear-gradient(135deg, #E9F8EC 0%, #d4f5df 100%)",
                              boxShadow: "0 2px 8px -2px rgba(47,191,91,0.25)",
                            }
                          : {}
                      }
                    >
                      {tab.icon}
                    </span>
                    <span
                      className="text-[9px] font-black transition-colors duration-200"
                      style={{ color: active ? "#1F9D55" : "#9CA3AF" }}
                    >
                      {tab.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
