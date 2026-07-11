import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Globe, LogOut, Plus, Trash2 } from "lucide-react-native";
import { useAuth } from "../lib/auth-context";
import { useCurrency, type CurrencyCode } from "../lib/currency-context";
import { useLanguage } from "../lib/i18n/language-context";
import { LANGUAGE_LABELS, type Language } from "../lib/i18n/translations";
import {
  clearToken,
  createCategory,
  deleteCategory,
  getCategories,
  updateMe,
  type Category,
} from "../lib/api";

const CURRENCY_OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: "USD", label: "US$ (US Dollar)" },
  { value: "DOP", label: "RD$ (Dominican Peso)" },
];

const PRESET_COLORS = ["#12876a", "#2a78d6", "#eda100", "#d946ef", "#a855f7", "#ef4444", "#64748b"];

export default function SettingsScreen() {
  const { user, setUser, refreshUser } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage, t } = useLanguage();

  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#12876a");
  const [catError, setCatError] = useState<string | null>(null);

  async function loadData() {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (e) {
      // get categories failed
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (user) {
        setUsername(user.username);
        setEmail(user.email);
      }
      loadData();
    }, [user])
  );

  async function handleProfileSubmit() {
    if (!username.trim() || !email.trim()) return;
    setProfileSaving(true);
    setProfileMsg(null);
    setProfileError(null);
    try {
      await updateMe({
        username: username.trim(),
        email: email.trim(),
        ...(password ? { password } : {}),
      });
      await refreshUser();
      setPassword("");
      setProfileMsg(t.settings.profileUpdated);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : t.settings.updateFailed);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleAddCategory() {
    if (!catName.trim()) return;
    setCatError(null);
    try {
      const created = await createCategory({ name: catName.trim(), color: catColor });
      setCategories((prev) => [...prev, created]);
      setCatName("");
    } catch (err) {
      setCatError(err instanceof Error ? err.message : t.settings.createCategoryFailed);
    }
  }

  async function handleDeleteCategory(id: number) {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      // delete failed
    }
  }

  function handleLogout() {
    clearToken();
    setUser(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Profile Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.settings.profile}</Text>
          <View style={styles.formFields}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.settings.username}</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                style={styles.input}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.settings.email}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                style={styles.input}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.settings.newPassword}</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder={t.settings.newPasswordPlaceholder}
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
            </View>

            {profileMsg && <Text style={styles.successText}>{profileMsg}</Text>}
            {profileError && <Text style={styles.errorText}>{profileError}</Text>}

            <TouchableOpacity
              onPress={handleProfileSubmit}
              disabled={profileSaving || !username || !email}
              style={[styles.saveBtn, (profileSaving || !username || !email) && styles.saveBtnDisabled]}
            >
              {profileSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveBtnText}>{t.settings.saveProfile}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Globe size={18} color="#12876a" />
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>{t.settings.preferences}</Text>
          </View>

          <View style={styles.formFields}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.settings.language}</Text>
              <View style={styles.langButtonsRow}>
                {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => {
                  const isActive = language === lang;
                  return (
                    <TouchableOpacity
                      key={lang}
                      onPress={() => setLanguage(lang)}
                      style={[styles.langBtn, isActive && styles.langBtnActive]}
                    >
                      <Text style={[styles.langBtnText, isActive && styles.langBtnTextActive]}>
                        {LANGUAGE_LABELS[lang]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.settings.currency}</Text>
              <View style={styles.currencySelectorRow}>
                {CURRENCY_OPTIONS.map((c) => {
                  const isActive = currency === c.value;
                  return (
                    <TouchableOpacity
                      key={c.value}
                      onPress={() => setCurrency(c.value)}
                      style={[styles.currencyBtn, isActive && styles.currencyBtnActive]}
                    >
                      <Text style={[styles.currencyBtnText, isActive && styles.currencyBtnTextActive]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Categories Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.settings.categories}</Text>
          <View style={styles.categoriesList}>
            {categories.map((c) => (
              <View key={c.id} style={styles.categoryItem}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.colorDot, { backgroundColor: c.color }]} />
                  <Text style={styles.categoryName}>{c.name}</Text>
                  {c.owner_id === null && (
                    <Text style={styles.defaultLabel}>{t.settings.default}</Text>
                  )}
                </View>
                {c.owner_id !== null && (
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(c.id)}
                    style={styles.deleteCategoryBtn}
                  >
                    <Trash2 size={16} color="#cbd5e1" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Add Category Form */}
          <View style={styles.addCategoryForm}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPillsScroll}>
              {PRESET_COLORS.map((col) => {
                const isSelected = catColor === col;
                return (
                  <TouchableOpacity
                    key={col}
                    onPress={() => setCatColor(col)}
                    style={[
                      styles.colorPill,
                      { backgroundColor: col },
                      isSelected && styles.colorPillSelected,
                    ]}
                  />
                );
              })}
            </ScrollView>
            <View style={styles.addCategoryInputRow}>
              <TextInput
                placeholder={t.settings.newCategoryPlaceholder}
                placeholderTextColor="#94a3b8"
                value={catName}
                onChangeText={setCatName}
                style={[styles.input, { flex: 1 }]}
              />
              <TouchableOpacity onPress={handleAddCategory} style={styles.addCategoryBtn}>
                <Plus size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
            {catError && <Text style={styles.errorText}>{catError}</Text>}
          </View>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} color="#f43f5e" />
          <Text style={styles.logoutText}>{t.settings.logout}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#effcf6", // brand-50 app canvas background
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0d463a",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  formFields: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    paddingLeft: 4,
  },
  input: {
    backgroundColor: "#effcf6",
    borderWidth: 1,
    borderColor: "#d9f7ec",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0d463a",
  },
  successText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1eb489",
    textAlign: "center",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f43f5e",
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: "#12876a",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  langButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  langBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#effcf6",
    borderRadius: 12,
    paddingVertical: 10,
  },
  langBtnActive: {
    backgroundColor: "#12876a",
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f6b56",
  },
  langBtnTextActive: {
    color: "#ffffff",
  },
  currencySelectorRow: {
    flexDirection: "row",
    gap: 8,
  },
  currencyBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#effcf6",
    borderRadius: 12,
    paddingVertical: 10,
  },
  currencyBtnActive: {
    backgroundColor: "#12876a",
  },
  currencyBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f6b56",
  },
  currencyBtnTextActive: {
    color: "#ffffff",
  },
  categoriesList: {
    gap: 8,
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#effcf6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0d463a",
  },
  defaultLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    backgroundColor: "#ffffff",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  deleteCategoryBtn: {
    padding: 4,
  },
  addCategoryForm: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#effcf6",
    paddingTop: 16,
  },
  colorPillsScroll: {
    flexDirection: "row",
    marginBottom: 4,
  },
  colorPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  colorPillSelected: {
    borderWidth: 2,
    borderColor: "#0d463a",
  },
  addCategoryInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  addCategoryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#12876a",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 14,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f43f5e",
  },
});
