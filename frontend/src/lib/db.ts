import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "talk_budget";
const DB_VERSION = 1;
const STORE_NAME = "chat_messages";

interface ChatMessageRecord {
  id?: number;
  localId: number;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  synced: boolean;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "localId",
            autoIncrement: true,
          });
          store.createIndex("conversationId", "conversationId");
          store.createIndex("synced", "synced");
        }
      },
    });
  }
  return dbPromise;
}

export async function getMessages(
  conversationId: string
): Promise<ChatMessageRecord[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_NAME, "conversationId", conversationId);
}

export async function addMessage(
  msg: Omit<ChatMessageRecord, "localId">
): Promise<number> {
  const db = await getDb();
  return db.add(STORE_NAME, msg as ChatMessageRecord) as Promise<number>;
}

export async function getUnsynchronized(): Promise<ChatMessageRecord[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_NAME);
  return all.filter((m) => !m.synced);
}

export async function markSynced(localIds: number[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  for (const id of localIds) {
    const record = await tx.store.get(id) as ChatMessageRecord | undefined;
    if (record) {
      record.synced = true;
      await tx.store.put(record);
    }
  }
  await tx.done;
}

export async function deleteConversation(
  conversationId: string
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const index = tx.store.index("conversationId");
  let cursor = await index.openCursor(conversationId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export type { ChatMessageRecord };
