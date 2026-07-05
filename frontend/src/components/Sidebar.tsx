"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Settings,
  Wallet,
  Wallet as WalletMark,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/transactions", label: t.nav.transactions, icon: Receipt },
    { href: "/wallets", label: t.nav.wallets, icon: Wallet },
  ];

  return (
    <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-brand-100 md:bg-white">
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 border-b border-brand-100 px-5 py-5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white">
          <WalletMark className="h-4 w-4" />
        </span>
        <span className="text-lg font-extrabold text-brand-900">{t.nav.appName}</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-brand-100 p-3">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
            pathname === "/settings"
              ? "bg-brand-50 text-brand-700"
              : "text-slate-500 hover:bg-brand-50 hover:text-brand-700"
          }`}
        >
          <Settings className="h-5 w-5" strokeWidth={pathname === "/settings" ? 2.5 : 2} />
          {t.nav.settings}
        </Link>
      </div>
    </aside>
  );
}
