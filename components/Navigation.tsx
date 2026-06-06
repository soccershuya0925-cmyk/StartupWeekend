"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/fridge", label: "冷蔵庫", icon: "🧊" },
  { href: "/shop", label: "ショップ", icon: "🍱" },
  { href: "/receipt", label: "レシート", icon: "🧾" },
  { href: "/cook", label: "記録", icon: "🍳" },
  { href: "/character", label: "キャラ", icon: "⭐" },
];

/** 下部固定ナビゲーションバー */
export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                  active ? "text-brand font-semibold" : "text-slate-400"
                }`}
              >
                <span className="text-lg" aria-hidden>
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
