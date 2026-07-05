// API fetching utilities for the FastAPI backend.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const TOKEN_KEY = "talk_budget_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Auth / users ---------------------------------------------------------

export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// OAuth2 password flow expects form-encoded body.
export async function login(
  username: string,
  password: string
): Promise<TokenResponse> {
  const body = new URLSearchParams({ username, password });
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? "Login failed");
  }
  return res.json();
}

export function getMe(): Promise<User> {
  return request<User>("/auth/me");
}

export interface UserUpdatePayload {
  username?: string;
  email?: string;
  password?: string;
}

export function updateMe(payload: UserUpdatePayload): Promise<User> {
  return request<User>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// --- Wallets ---------------------------------------------------------------

export interface Wallet {
  id: number;
  name: string;
  type: string;
  balance: string;
  currency: string;
  owner_id: number;
}

export interface WalletCreatePayload {
  name: string;
  type: string;
  balance?: number;
  currency?: string;
}

export function getWallets(): Promise<Wallet[]> {
  return request<Wallet[]>("/wallets");
}

export function createWallet(payload: WalletCreatePayload): Promise<Wallet> {
  return request<Wallet>("/wallets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// --- Categories --------------------------------------------------------------

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  owner_id: number | null;
}

export interface CategoryPayload {
  name: string;
  icon?: string;
  color?: string;
}

export function getCategories(): Promise<Category[]> {
  return request<Category[]>("/categories");
}

export function createCategory(payload: CategoryPayload): Promise<Category> {
  return request<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCategory(
  id: number,
  payload: Partial<CategoryPayload>
): Promise<Category> {
  return request<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCategory(id: number): Promise<void> {
  return request<void>(`/categories/${id}`, { method: "DELETE" });
}

// --- Transactions ------------------------------------------------------------

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: number;
  amount: string;
  type: TransactionType;
  description: string | null;
  wallet_id: number;
  category_id: number | null;
  owner_id: number;
  occurred_at: string;
}

export interface TransactionCreatePayload {
  amount: number;
  type: TransactionType;
  description?: string;
  wallet_id: number;
  category_id?: number;
  occurred_at?: string;
}

export interface TransactionFilters {
  start_date?: string;
  end_date?: string;
  category_id?: number;
  wallet_id?: number;
}

export function getTransactions(
  filters: TransactionFilters = {}
): Promise<Transaction[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const qs = params.toString();
  return request<Transaction[]>(`/transactions${qs ? `?${qs}` : ""}`);
}

export function createTransaction(
  payload: TransactionCreatePayload
): Promise<Transaction> {
  return request<Transaction>("/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteTransaction(id: number): Promise<void> {
  return request<void>(`/transactions/${id}`, { method: "DELETE" });
}

// --- Agent chat --------------------------------------------------------------

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function sendChatMessage(
  messages: ChatMessage[],
  conversationId?: string
): Promise<{ reply: string }> {
  return request<{ reply: string }>("/agent/chat", {
    method: "POST",
    body: JSON.stringify({ messages, conversation_id: conversationId }),
  });
}

// --- Chat history ------------------------------------------------------------

export interface ChatMessageRecord {
  id: number;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
  owner_id: number;
}

export interface ConversationSummary {
  conversation_id: string;
  title: string;
  message_count: number;
}

export function getChatHistory(
  conversationId?: string
): Promise<ChatMessageRecord[]> {
  const params = conversationId
    ? `?conversation_id=${encodeURIComponent(conversationId)}`
    : "";
  return request<ChatMessageRecord[]>(`/chat-history${params}`);
}

export function getConversations(): Promise<ConversationSummary[]> {
  return request<ConversationSummary[]>("/chat-history/conversations");
}

export function syncChatHistory(
  messages: { role: string; content: string; conversation_id: string }[]
): Promise<{ saved: number }> {
  return request<{ saved: number }>("/chat-history/sync", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}

export function deleteConversation(conversationId: string): Promise<void> {
  return request<void>(`/chat-history/${conversationId}`, {
    method: "DELETE",
  });
}
