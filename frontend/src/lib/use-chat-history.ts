"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addMessage,
  deleteConversation as deleteConversationFromDB,
  getMessages,
  getUnsynchronized,
  markSynced,
  type ChatMessageRecord,
} from "@/lib/db";
import {
  getChatHistory,
  getConversations,
  syncChatHistory,
  type ChatMessage,
  type ConversationSummary,
} from "@/lib/api";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

const SESSION_CONV_ID_KEY = "tb_active_conversation";

function generateUUID(): string {
  return crypto.randomUUID?.() ??
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

function loadSessionMessages(conversationId: string): Message[] | null {
  try {
    const raw = sessionStorage.getItem(`tb_chat_${conversationId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // corrupted data
  }
  return null;
}

function saveSessionMessages(conversationId: string, messages: Message[]) {
  try {
    sessionStorage.setItem(
      `tb_chat_${conversationId}`,
      JSON.stringify(messages)
    );
  } catch {
    // quota exceeded or unavailable
  }
}

function removeSessionConversation(conversationId: string) {
  try {
    sessionStorage.removeItem(`tb_chat_${conversationId}`);
  } catch {
    // ignore
  }
}

function restoreConversationId(): string {
  try {
    const saved = sessionStorage.getItem(SESSION_CONV_ID_KEY);
    if (saved) return saved;
  } catch {
    // ignore
  }
  const fresh = generateUUID();
  try {
    sessionStorage.setItem(SESSION_CONV_ID_KEY, fresh);
  } catch {
    // ignore
  }
  return fresh;
}

function persistConversationId(conversationId: string) {
  try {
    sessionStorage.setItem(SESSION_CONV_ID_KEY, conversationId);
  } catch {
    // ignore
  }
}

export function useChatHistory(username: string) {
  const conversationIdRef = useRef<string>(restoreConversationId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loaded, setLoaded] = useState(false);

  const buildFallbackGreeting = useCallback((): Message[] => {
    return [
      {
        role: "assistant",
        content: `Hi ${username}! Ask me about your spending, or tell me to log a transaction or category.`,
      },
    ];
  }, [username]);

  const syncToServer = useCallback(async () => {
    try {
      const unsynced = await getUnsynchronized();
      if (unsynced.length === 0) return;
      const payload = unsynced.map((m) => ({
        role: m.role,
        content: m.content,
        conversation_id: m.conversationId,
      }));
      await syncChatHistory(payload);
      await markSynced(unsynced.map((m) => m.localId));
    } catch {
      // background sync failure is non-fatal
    }
  }, []);

  const loadFromServer = useCallback(async (cid: string) => {
    try {
      const serverMsgs = await getChatHistory(cid);
      if (serverMsgs.length > 0) {
        return serverMsgs.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      }
    } catch {
      // server unreachable — use local only
    }
    return null;
  }, []);

  const loadConversation = useCallback(
    async (cid: string, { greetOnEmpty }: { greetOnEmpty: boolean }) => {
      // 1. Session storage (instant — survives page navigation)
      const sessionMsgs = loadSessionMessages(cid);
      if (sessionMsgs && sessionMsgs.length > 0) {
        setMessages(sessionMsgs);
        syncToServer();
        return;
      }

      // 2. IndexedDB (fast — survives tab close)
      const localRecords = await getMessages(cid);
      const localMsgs: Message[] = localRecords
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      // 3. Server (source of truth)
      const serverMsgs = await loadFromServer(cid);
      const finalMsgs =
        serverMsgs && serverMsgs.length > 0 ? serverMsgs : localMsgs;

      if (finalMsgs.length > 0) {
        setMessages(finalMsgs);
        saveSessionMessages(cid, finalMsgs);
      } else if (greetOnEmpty) {
        const greeting = buildFallbackGreeting();
        setMessages(greeting);
        saveSessionMessages(cid, greeting);
        for (const m of greeting) {
          await addMessage({
            conversationId: cid,
            role: m.role,
            content: m.content,
            createdAt: new Date().toISOString(),
            synced: false,
          });
        }
        await syncToServer();
      } else {
        setMessages([]);
      }
    },
    [buildFallbackGreeting, loadFromServer, syncToServer]
  );

  useEffect(() => {
    (async () => {
      await loadConversation(conversationIdRef.current, { greetOnEmpty: true });
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const list = await getConversations();
      setConversations(
        list.map((c: ConversationSummary) => ({
          id: c.conversation_id,
          title: c.title,
          messages: [],
        }))
      );
    } catch {
      // server unreachable — keep whatever we had
    }
  }, []);

  const switchConversation = useCallback(
    async (cid: string) => {
      conversationIdRef.current = cid;
      persistConversationId(cid);
      setLoaded(false);
      await loadConversation(cid, { greetOnEmpty: false });
      setLoaded(true);
    },
    [loadConversation]
  );

  const sendMessage = useCallback(
    async (
      text: string,
      sendFn: (messages: ChatMessage[], conversationId?: string) => Promise<{ reply: string }>
    ) => {
      const cid = conversationIdRef.current;
      const now = new Date().toISOString();

      setMessages((prev) => {
        const next = [...prev, { role: "user", content: text } as Message];
        saveSessionMessages(cid, next);
        return next;
      });

      await addMessage({
        conversationId: cid,
        role: "user",
        content: text,
        createdAt: now,
        synced: false,
      });

      const history: ChatMessage[] = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: text },
      ];

      try {
        const res = await sendFn(history, cid);
        const assistantMsg: Message = { role: "assistant", content: res.reply };
        setMessages((prev) => {
          const next = [...prev, assistantMsg];
          saveSessionMessages(cid, next);
          return next;
        });

        await addMessage({
          conversationId: cid,
          role: "assistant",
          content: res.reply,
          createdAt: new Date().toISOString(),
          synced: true,
        });

        await syncToServer();
        return assistantMsg;
      } catch (err) {
        await syncToServer();
        throw err;
      }
    },
    [messages, syncToServer]
  );

  const newConversation = useCallback(() => {
    removeSessionConversation(conversationIdRef.current);
    const freshId = generateUUID();
    conversationIdRef.current = freshId;
    persistConversationId(freshId);
    const greeting = buildFallbackGreeting();
    setMessages(greeting);
    saveSessionMessages(freshId, greeting);
    for (const m of greeting) {
      addMessage({
        conversationId: freshId,
        role: m.role,
        content: m.content,
        createdAt: new Date().toISOString(),
        synced: false,
      });
    }
  }, [buildFallbackGreeting]);

  const removeConversation = useCallback(
    async (conversationId: string) => {
      await deleteConversationFromDB(conversationId);
      removeSessionConversation(conversationId);
      const { deleteConversation: delConv } = await import("@/lib/api");
      try {
        await delConv(conversationId);
      } catch {
        // non-fatal
      }
      if (conversationId === conversationIdRef.current) {
        newConversation();
      }
    },
    [newConversation]
  );

  return {
    messages,
    setMessages,
    conversations,
    loaded,
    conversationId: conversationIdRef.current,
    sendMessage,
    newConversation,
    removeConversation,
    switchConversation,
    refreshConversations,
    syncToServer,
  };
}
