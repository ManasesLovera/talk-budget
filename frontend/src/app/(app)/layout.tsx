"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { AuthContext } from "@/lib/auth-context";
import { clearToken, getMe, getToken, type User } from "@/lib/api";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
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
        Loading…
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, refreshUser }}>
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <main className="flex-1 pb-6">{children}</main>
        <BottomNav />
      </div>
    </AuthContext.Provider>
  );
}
