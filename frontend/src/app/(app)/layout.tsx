"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import { AuthContext } from "@/lib/auth-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { useLanguage } from "@/lib/i18n/language-context";
import { clearToken, getMe, getToken, type User } from "@/lib/api";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      clearToken();
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    refreshUser();
  }, [router, refreshUser]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand-600">
        {t.common.loading}
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, refreshUser }}>
      <CurrencyProvider>
        <div className="flex h-screen overflow-hidden" data-testid="app-shell">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto">{children}</main>
            <BottomNav />
          </div>
          <ChatWidget />
        </div>
      </CurrencyProvider>
    </AuthContext.Provider>
  );
}
