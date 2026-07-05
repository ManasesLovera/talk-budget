"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import { useIsDesktop } from "@/lib/use-is-desktop";

export default function ChatPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isDesktop) router.replace("/dashboard");
  }, [isDesktop, router]);

  if (isDesktop) return null;

  return <ChatPanel />;
}
