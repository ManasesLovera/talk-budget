"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="hidden md:block">
      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex max-h-[80vh] w-[380px] flex-col overflow-hidden rounded-card bg-mint-bg shadow-card">
          <div className="flex shrink-0 items-center justify-between bg-brand-gradient px-4 py-3 text-white">
            <span className="text-sm font-bold">Talk Budget Assistant</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full bg-white/15 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <ChatPanel />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-card"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  );
}
