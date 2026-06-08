"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/feed", label: "フィード", icon: "👥" },
  { href: "/fridge", label: "冷蔵庫", icon: "🧊" },
  { href: "/receipt", label: "レシート", icon: "🧾" },
  { href: "/cook", label: "料理", icon: "🍳" },
  { href: "/stats", label: "実績", icon: "📊" },
  { href: "/character", label: "キャラ", icon: "⭐" },
];

/** 下部固定ナビゲーションバー */
export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <ul className="mx-auto flex max-w-md items-stretch justify-between gap-1 border-t border-black/5 bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold transition-all ${
                  active ? "text-brand" : "text-ink-soft/60"
                }`}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full text-lg transition-all ${
                    active ? "-translate-y-0.5 bg-brand-light" : ""
                  }`}
                  aria-hidden
                >
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
