"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, Receipt, Wallet } from "lucide-react";

const TABS = [
  { href: "/", label: "Chat", icon: Bot },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wallets", label: "Wallets", icon: Wallet },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-brand-100 bg-white/95 backdrop-blur">
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
