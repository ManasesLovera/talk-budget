import AsyncStorage from "@react-native-async-storage/async-storage";

const STORE_KEY = "talk_budget_chat_messages";

interface ChatMessageRecord {
  id?: number;
  localId: number;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  synced: boolean;
}

async function getAllMessages(): Promise<ChatMessageRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    // corrupted or empty
  }
  return [];
}

async function saveAllMessages(messages: ChatMessageRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(messages));
}

export async function getMessages(
  conversationId: string
): Promise<ChatMessageRecord[]> {
  const all = await getAllMessages();
  return all.filter((m) => m.conversationId === conversationId);
}

export async function addMessage(
  msg: Omit<ChatMessageRecord, "localId">
): Promise<number> {
  const all = await getAllMessages();
  const localId = Date.now() + Math.floor(Math.random() * 1000);
  const newRecord: ChatMessageRecord = {
    ...msg,
    localId,
  };
  all.push(newRecord);
  await saveAllMessages(all);
  return localId;
}

export async function getUnsynchronized(): Promise<ChatMessageRecord[]> {
  const all = await getAllMessages();
  return all.filter((m) => !m.synced);
}

export async function markSynced(localIds: number[]): Promise<void> {
  const all = await getAllMessages();
  const updated = all.map((m) => {
    if (localIds.includes(m.localId)) {
      return { ...m, synced: true };
    }
    return m;
  });
  await saveAllMessages(updated);
}

export async function deleteConversation(
  conversationId: string
): Promise<void> {
  const all = await getAllMessages();
  const filtered = all.filter((m) => m.conversationId !== conversationId);
  await saveAllMessages(filtered);
}

export type { ChatMessageRecord };
