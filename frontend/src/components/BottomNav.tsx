"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, LayoutTemplate, Receipt, Wallet } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const TABS = [
    { href: "/", label: t.nav.chat, icon: Bot },
    { href: "/transactions", label: t.nav.transactions, icon: Receipt },
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/wallets", label: t.nav.wallets, icon: Wallet },
    { href: "/templates", label: t.nav.templates, icon: LayoutTemplate },
  ];

  return (
    <nav className="flex shrink-0 border-t border-brand-100 bg-white/95 backdrop-blur md:hidden">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
              active ? "text-brand-600" : "text-slate-400"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
