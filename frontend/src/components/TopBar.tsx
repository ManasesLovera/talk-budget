"use client";

import { useRouter, usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const TITLES: Record<string, string> = {
    "/": t.topbar.chat,
    "/transactions": t.topbar.transactions,
    "/dashboard": t.topbar.dashboard,
    "/wallets": t.topbar.walletsLoans,
    "/settings": t.topbar.settings,
  };
  const title = TITLES[pathname] ?? t.topbar.chat;

  return (
    <>
      <header className="bg-brand-gradient flex shrink-0 items-center justify-between rounded-b-card px-5 py-4 text-white shadow-card md:hidden">
        <h1 className="text-lg font-extrabold">{title}</h1>
        <button
          onClick={() => router.push("/settings")}
          aria-label="Settings"
          className="rounded-full bg-white/15 p-2"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>
      <header className="hidden shrink-0 border-b border-brand-100 px-8 py-5 md:block">
        <h1 className="text-xl font-extrabold text-brand-900">{title}</h1>
      </header>
    </>
  );
}
