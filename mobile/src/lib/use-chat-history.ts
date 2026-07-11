import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addMessage,
  deleteConversation as deleteConversationFromDB,
  getMessages,
  getUnsynchronized,
  markSynced,
  type ChatMessageRecord,
} from "./db";
import {
  getChatHistory,
  getConversations,
  syncChatHistory,
  deleteConversation as deleteConversationFromAPI,
  type ChatMessage,
  type ConversationSummary,
} from "./api";

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
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// In React Native, we can use a memory cache instead of sessionStorage
const sessionMessagesCache: Record<string, Message[]> = {};

function loadSessionMessages(conversationId: string): Message[] | null {
  return sessionMessagesCache[conversationId] || null;
}

function saveSessionMessages(conversationId: string, messages: Message[]) {
  sessionMessagesCache[conversationId] = messages;
}

function removeSessionConversation(conversationId: string) {
  delete sessionMessagesCache[conversationId];
}

export function useChatHistory(username: string) {
  const [conversationId, setConversationId] = useState<string>("");
  const conversationIdRef = useRef<string>("");
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
      // 1. Session memory cache (instant)
      const sessionMsgs = loadSessionMessages(cid);
      if (sessionMsgs && sessionMsgs.length > 0) {
        setMessages(sessionMsgs);
        syncToServer();
        return;
      }

      // 2. AsyncStorage local DB (survives app restart)
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

  // Initialize active conversation ID from storage
  useEffect(() => {
    (async () => {
      let saved = await AsyncStorage.getItem(SESSION_CONV_ID_KEY);
      if (!saved) {
        saved = generateUUID();
        await AsyncStorage.setItem(SESSION_CONV_ID_KEY, saved);
      }
      conversationIdRef.current = saved;
      setConversationId(saved);
      await loadConversation(saved, { greetOnEmpty: true });
      setLoaded(true);
    })();
  }, [loadConversation]);

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
      setConversationId(cid);
      await AsyncStorage.setItem(SESSION_CONV_ID_KEY, cid);
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

      // Prepare history including the new user message
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

  const newConversation = useCallback(async () => {
    removeSessionConversation(conversationIdRef.current);
    const freshId = generateUUID();
    conversationIdRef.current = freshId;
    setConversationId(freshId);
    await AsyncStorage.setItem(SESSION_CONV_ID_KEY, freshId);
    
    const greeting = buildFallbackGreeting();
    setMessages(greeting);
    saveSessionMessages(freshId, greeting);
    for (const m of greeting) {
      await addMessage({
        conversationId: freshId,
        role: m.role,
        content: m.content,
        createdAt: new Date().toISOString(),
        synced: false,
      });
    }
  }, [buildFallbackGreeting]);

  const removeConversation = useCallback(
    async (targetCid: string) => {
      await deleteConversationFromDB(targetCid);
      removeSessionConversation(targetCid);
      try {
        await deleteConversationFromAPI(targetCid);
      } catch {
        // non-fatal
      }
      if (targetCid === conversationIdRef.current) {
        await newConversation();
      }
    },
    [newConversation]
  );

  return {
    messages,
    setMessages,
    conversations,
    loaded,
    conversationId,
    sendMessage,
    newConversation,
    removeConversation,
    switchConversation,
    refreshConversations,
    syncToServer,
  };
}
