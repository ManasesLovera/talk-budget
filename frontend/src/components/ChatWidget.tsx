"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import { useLanguage } from "@/lib/i18n/language-context";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="hidden md:block">
      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex max-h-[80vh] w-[380px] flex-col overflow-hidden rounded-card bg-mint-bg shadow-card">
          <div className="flex shrink-0 items-center justify-between bg-brand-gradient px-4 py-3 text-white">
            <span className="text-sm font-bold">{t.chat.assistantTitle}</span>
            <button
              onClick={() => setOpen(false)}
              aria-label={t.chat.closeChat}
              className="rounded-full bg-white/15 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <ChatPanel />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t.chat.closeChat : t.chat.openChat}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-card"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  );
}
