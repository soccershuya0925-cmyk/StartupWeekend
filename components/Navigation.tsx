"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "フィード", icon: "🏠" },
  { href: "/fridge", label: "冷蔵庫", icon: "🧊" },
  { href: "/cook", label: "投稿", icon: "➕", accent: true },
  { href: "/recipe", label: "レシピ", icon: "📖" },
  { href: "/character", label: "キャラ", icon: "⭐" },
  { href: "/profile", label: "マイページ", icon: "👤" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-white shadow-[0_-1px_0_rgba(0,0,0,0.06)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-between pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              {tab.accent ? (
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className="flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-bold text-brand"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-lg text-white shadow-glow"
                    aria-hidden
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </Link>
              ) : (
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-bold transition-colors ${
                    active ? "text-brand" : "text-slate-400"
                  }`}
                >
                  <span
                    className={`flex h-7 w-8 items-center justify-center rounded-xl text-lg transition-all ${
                      active ? "bg-brand-light" : ""
                    }`}
                    aria-hidden
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
