"use client";

import { useRef, useState, type MouseEvent } from "react";
import { Send, Trash2, Plus, History, MessageSquare } from "lucide-react";
import { sendChatMessage, type ChatMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useChatHistory } from "@/lib/use-chat-history";
import { useLanguage } from "@/lib/i18n/language-context";

export default function ChatPanel() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const SUGGESTIONS = t.chat.suggestions;
  const {
    messages,
    setMessages,
    loaded,
    conversations,
    sendMessage,
    newConversation,
    removeConversation,
    switchConversation,
    refreshConversations,
    conversationId,
  } = useChatHistory(user.username);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function toggleHistory() {
    setShowHistory((prev) => {
      const next = !prev;
      if (next) refreshConversations();
      return next;
    });
  }

  async function openConversation(id: string) {
    await switchConversation(id);
    setShowHistory(false);
  }

  async function deleteConversationFromHistory(id: string, e: MouseEvent) {
    e.stopPropagation();
    await removeConversation(id);
    await refreshConversations();
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    setLoading(true);
    try {
      await sendMessage(trimmed, sendChatMessage);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error ? `Error: ${err.message}` : t.chat.somethingWentWrong,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-slate-400">{t.chat.loading}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-4">
      <div className="flex items-center justify-between py-2">
        <button
          onClick={newConversation}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {t.chat.newChat}
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleHistory}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium hover:bg-brand-50 ${
              showHistory ? "bg-brand-50 text-brand-700" : "text-brand-600"
            }`}
          >
            {showHistory ? (
              <MessageSquare className="h-3.5 w-3.5" />
            ) : (
              <History className="h-3.5 w-3.5" />
            )}
            {showHistory ? t.chat.backToChat : t.chat.history}
          </button>
          <button
            onClick={() => removeConversation(conversationId)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t.chat.delete}
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto py-4">
          {conversations.length === 0 ? (
            <div className="text-sm text-slate-400">{t.chat.noConversations}</div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm shadow-sm ${
                  c.id === conversationId
                    ? "bg-brand-50 text-brand-900"
                    : "bg-white text-slate-700 hover:bg-brand-50"
                }`}
              >
                <button
                  onClick={() => openConversation(c.id)}
                  className="flex-1 truncate text-left"
                >
                  {c.title}
                </button>
                <button
                  onClick={(e) => deleteConversationFromHistory(c.id, e)}
                  aria-label={`Delete conversation ${c.title}`}
                  className="shrink-0 rounded-full p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  m.role === "user"
                    ? "bg-brand-gradient text-white"
                    : "bg-white text-brand-900"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white px-4 py-2.5 text-sm text-slate-400 shadow-sm">
                {t.chat.thinking}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {!showHistory && messages.length <= 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {!showHistory && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mb-3 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-card"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chat.askPlaceholder}
            className="flex-1 bg-transparent px-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-brand-gradient flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
