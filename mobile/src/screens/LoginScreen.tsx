import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lock, User as UserIcon, Wallet } from "lucide-react-native";
import { login, setToken } from "../lib/api";
import { useLanguage } from "../lib/i18n/language-context";
import { useAuth } from "../lib/auth-context";

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export default function LoginScreen({ onNavigateToRegister }: LoginScreenProps) {
  const { t } = useLanguage();
  const { refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!username.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      await setToken(res.access_token);
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.login.loginFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Brand banner header (matches web bg-brand-gradient header) */}
          <View style={[styles.header, { paddingTop: insets.top + 40 }]}>
            <View style={styles.logoContainer}>
              <Wallet size={32} color="#ffffff" />
            </View>
            <Text style={styles.appName}>{t.nav.appName}</Text>
            <Text style={styles.subtitle}>{t.login.subtitle}</Text>
          </View>

          {/* Login Form Box */}
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>{t.login.username}</Text>
            <View style={styles.inputWrapper}>
              <UserIcon size={18} color="#1eb489" style={styles.inputIcon} />
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder={t.login.usernamePlaceholder}
                placeholderTextColor="#94a3b8"
                style={styles.textInput}
              />
            </View>

            <Text style={styles.inputLabel}>{t.login.password}</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#1eb489" style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                style={styles.textInput}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || !username || !password}
              style={[styles.submitBtn, (loading || !username || !password) && styles.submitBtnDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>{t.login.signIn}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>{t.login.noAccount}</Text>
              <TouchableOpacity onPress={onNavigateToRegister}>
                <Text style={styles.footerLink}>{t.login.createOne}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d6f5ea", // mint-bg
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#12876a", // brand-gradient start
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 44,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: -24,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0d463a",
    marginBottom: 6,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#effcf6",
    borderWidth: 1,
    borderColor: "#d9f7ec",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#0d463a",
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f43f5e",
    textAlign: "center",
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: "#12876a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: "#64748b",
  },
  footerLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1eb489",
  },
});
