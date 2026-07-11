import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Send, Trash2, Plus, History, MessageSquare } from "lucide-react-native";
import { useAuth } from "../lib/auth-context";
import { useChatHistory } from "../lib/use-chat-history";
import { useLanguage } from "../lib/i18n/language-context";
import { sendChatMessage } from "../lib/api";

export default function ChatScreen() {
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
  } = useChatHistory(user?.username ?? "User");

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (messages.length > 0 && !showHistory) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, showHistory]);

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

  async function deleteConversationFromHistory(id: string) {
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
          content: err instanceof Error ? `Error: ${err.message}` : t.chat.somethingWentWrong,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  if (!loaded) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#12876a" />
        <Text style={styles.loadingText}>{t.chat.loading}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Chat top header bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={newConversation} style={styles.headerButton}>
            <Plus size={16} color="#12876a" />
            <Text style={styles.headerButtonText}>{t.chat.newChat}</Text>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleHistory} style={[styles.headerButton, showHistory && styles.headerButtonActive]}>
              {showHistory ? (
                <MessageSquare size={16} color={showHistory ? "#0f6b56" : "#12876a"} />
              ) : (
                <History size={16} color="#12876a" />
              )}
              <Text style={[styles.headerButtonText, showHistory && styles.headerButtonTextActive]}>
                {showHistory ? t.chat.backToChat : t.chat.history}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => removeConversation(conversationId)}
              style={[styles.headerButton, { borderColor: "#fee2e2" }]}
            >
              <Trash2 size={16} color="#ef4444" />
              <Text style={[styles.headerButtonText, { color: "#ef4444" }]}>{t.chat.delete}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area */}
        {showHistory ? (
          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.historyContainer}>
            {conversations.length === 0 ? (
              <Text style={styles.emptyText}>{t.chat.noConversations}</Text>
            ) : (
              conversations.map((c) => {
                const isActive = c.id === conversationId;
                return (
                  <View
                    key={c.id}
                    style={[styles.historyItem, isActive && styles.historyItemActive]}
                  >
                    <TouchableOpacity
                      onPress={() => openConversation(c.id)}
                      style={styles.historyItemBtn}
                    >
                      <Text
                        style={[styles.historyItemText, isActive && styles.historyItemTextActive]}
                        numberOfLines={1}
                      >
                        {c.title || "Untitled Conversation"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteConversationFromHistory(c.id)}
                      style={styles.historyItemDelete}
                    >
                      <Trash2 size={16} color="#fca5a5" />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        ) : (
          <>
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollArea}
              contentContainerStyle={styles.messagesContainer}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <View
                    key={i}
                    style={[styles.bubbleWrapper, isUser ? styles.bubbleUserWrapper : styles.bubbleAssistantWrapper]}
                  >
                    <View
                      style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}
                    >
                      <Text style={[styles.bubbleText, isUser ? styles.bubbleUserText : styles.bubbleAssistantText]}>
                        {m.content}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {loading && (
                <View style={[styles.bubbleWrapper, styles.bubbleAssistantWrapper]}>
                  <View style={[styles.bubble, styles.bubbleAssistant]}>
                    <Text style={styles.thinkingText}>{t.chat.thinking}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Suggestions pills */}
            {messages.length <= 1 && (
              <View style={styles.suggestionsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                  {SUGGESTIONS.map((s) => (
                    <TouchableOpacity key={s} onPress={() => send(s)} style={styles.suggestionPill}>
                      <Text style={styles.suggestionText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Message input form */}
            <View style={styles.inputForm}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={t.chat.askPlaceholder}
                placeholderTextColor="#94a3b8"
                style={styles.textInput}
              />
              <TouchableOpacity
                onPress={() => send(input)}
                disabled={loading || !input.trim()}
                style={[styles.sendBtn, (loading || !input.trim()) && styles.sendBtnDisabled]}
              >
                <Send size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#effcf6", // brand-50 as app background
  },
  keyboardAvoid: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#effcf6",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#d9f7ec",
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#b3efd9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
  },
  headerButtonActive: {
    backgroundColor: "#d9f7ec",
    borderColor: "#7fe1c0",
  },
  headerButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#12876a",
  },
  headerButtonTextActive: {
    color: "#0f6b56",
  },
  headerRight: {
    flexDirection: "row",
    gap: 6,
  },
  scrollArea: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  bubbleWrapper: {
    flexDirection: "row",
    width: "100%",
  },
  bubbleUserWrapper: {
    justifyContent: "flex-end",
  },
  bubbleAssistantWrapper: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: "#12876a", // primary brand color instead of gradient
    borderTopRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleUserText: {
    color: "#ffffff",
  },
  bubbleAssistantText: {
    color: "#0d463a",
  },
  thinkingText: {
    color: "#94a3b8",
    fontStyle: "italic",
    fontSize: 14,
  },
  suggestionsWrapper: {
    backgroundColor: "transparent",
    paddingVertical: 8,
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionPill: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#b3efd9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#0f6b56",
  },
  inputForm: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 6,
    borderRadius: 24,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#0d463a",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendBtn: {
    backgroundColor: "#12876a",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  historyContainer: {
    padding: 16,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 20,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  historyItemActive: {
    backgroundColor: "#d9f7ec",
  },
  historyItemBtn: {
    flex: 1,
  },
  historyItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  historyItemTextActive: {
    color: "#0d463a",
    fontWeight: "700",
  },
  historyItemDelete: {
    padding: 4,
  },
});
