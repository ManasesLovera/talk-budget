import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal as RNModal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeftRight, Edit2, Plus, TrendingDown, TrendingUp, Trash2, X, ChevronDown } from "lucide-react-native";
import {
  createTransactionTemplate,
  deleteTransactionTemplate,
  getCategories,
  getTransactionTemplates,
  getWallets,
  updateTransactionTemplate,
  type Category,
  type TransactionTemplate,
  type TransactionType,
  type Wallet,
} from "../lib/api";
import { useLanguage } from "../lib/i18n/language-context";

const TYPE_ICONS: Record<TransactionType, any> = {
  income: TrendingUp,
  expense: TrendingDown,
  transfer: ArrowLeftRight,
};

export default function TemplatesScreen() {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection modal state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<"wallet" | "category" | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [tmpls, cats, wals] = await Promise.all([
        getTransactionTemplates(),
        getCategories(),
        getWallets(),
      ]);
      setTemplates(tmpls);
      setCategories(cats);
      setWallets(wals);
    } catch (e) {
      // loading failed
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  function openEdit(template: TransactionTemplate) {
    setEditingId(template.id);
    setName(template.name);
    setType(template.type);
    setAmount(template.amount ?? "");
    setWalletId(template.wallet_id ? String(template.wallet_id) : "");
    setCategoryId(template.category_id ? String(template.category_id) : "");
    setDescription(template.description ?? "");
    setFormOpen(true);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setType("expense");
    setAmount("");
    setWalletId("");
    setCategoryId("");
    setDescription("");
    setError(null);
  }

  async function handleSubmit() {
    if (!name) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name,
        type,
        amount: amount ? parseFloat(amount) : null,
        wallet_id: walletId ? parseInt(walletId, 10) : null,
        category_id: categoryId ? parseInt(categoryId, 10) : null,
        description: description || null,
      };
      if (editingId) {
        await updateTransactionTemplate(editingId, payload);
      } else {
        await createTransactionTemplate(payload);
      }
      resetForm();
      setFormOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.templates.saveFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTransactionTemplate(id);
      await loadData();
    } catch (err) {
      // delete failed
    }
  }

  const getWalletName = () => {
    return wallets.find((w) => String(w.id) === walletId)?.name ?? t.templates.noWallet;
  };

  const getCategoryName = () => {
    return categories.find((c) => String(c.id) === categoryId)?.name ?? t.transactions.noCategory;
  };

  const openPicker = (pType: "wallet" | "category") => {
    setPickerType(pType);
    setPickerOpen(true);
  };

  const handleSelectOption = (val: string) => {
    if (pickerType === "wallet") {
      setWalletId(val);
    } else if (pickerType === "category") {
      setCategoryId(val);
    }
    setPickerOpen(false);
    setPickerType(null);
  };

  const getPickerData = () => {
    if (pickerType === "wallet") {
      return [
        { key: "", label: t.templates.noWallet },
        ...wallets.map((w) => ({ key: String(w.id), label: w.name })),
      ];
    } else {
      return [
        { key: "", label: t.transactions.noCategory },
        ...categories.map((c) => ({ key: String(c.id), label: c.name })),
      ];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Toggle Form Button */}
        {!formOpen && (
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setFormOpen(true);
            }}
            style={styles.addButton}
          >
            <Plus size={16} color="#12876a" />
            <Text style={styles.addButtonText}>{t.templates.addTemplate}</Text>
          </TouchableOpacity>
        )}

        {/* Create/Edit Form */}
        {formOpen && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editingId ? t.templates.editTemplate : t.templates.newTemplate}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setFormOpen(false);
                  resetForm();
                }}
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.formFields}>
              <TextInput
                placeholder={t.templates.namePlaceholder}
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />

              {/* Type Switcher */}
              <View style={styles.typesRow}>
                {(["expense", "income", "transfer"] as TransactionType[]).map((opt) => {
                  const isActive = type === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setType(opt)}
                      style={[styles.typeButton, isActive && styles.typeButtonActive]}
                    >
                      <Text style={[styles.typeButtonText, isActive && styles.typeButtonTextActive]}>
                        {t.transactions[opt]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                placeholder={t.templates.amountPlaceholder}
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                style={styles.input}
              />

              <TouchableOpacity onPress={() => openPicker("wallet")} style={styles.select}>
                <Text style={styles.selectText}>{getWalletName()}</Text>
                <ChevronDown size={16} color="#0d463a" />
              </TouchableOpacity>

              {type !== "transfer" && (
                <TouchableOpacity onPress={() => openPicker("category")} style={styles.select}>
                  <Text style={styles.selectText}>{getCategoryName()}</Text>
                  <ChevronDown size={16} color="#0d463a" />
                </TouchableOpacity>
              )}

              <TextInput
                placeholder={t.transactions.descriptionPlaceholder}
                placeholderTextColor="#94a3b8"
                value={description}
                onChangeText={setDescription}
                style={styles.input}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting || !name}
                style={[styles.saveButton, (submitting || !name) && styles.saveButtonDisabled]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {submitting ? t.common.saving : t.common.save}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="small" color="#12876a" style={{ marginVertical: 32 }} />
        ) : templates.length === 0 ? (
          <Text style={styles.emptyText}>{t.templates.noTemplates}</Text>
        ) : (
          <View style={styles.itemsList}>
            {templates.map((tmpl) => {
              const Icon = TYPE_ICONS[tmpl.type] || TrendingDown;
              const walletName = wallets.find((w) => w.id === tmpl.wallet_id)?.name;
              const categoryName = categories.find((c) => c.id === tmpl.category_id)?.name;
              const metaText = [walletName, categoryName].filter(Boolean).join(" • ") || t.templates.noWallet;

              return (
                <View key={tmpl.id} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <View style={styles.iconContainer}>
                      <Icon size={16} color="#12876a" />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>{tmpl.name}</Text>
                      <Text style={styles.itemMeta} numberOfLines={1}>{metaText}</Text>
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    <TouchableOpacity onPress={() => openEdit(tmpl)} style={styles.actionBtn}>
                      <Edit2 size={14} color="#94a3b8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(tmpl.id)} style={styles.actionBtn}>
                      <Trash2 size={14} color="#cbd5e1" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Option Picker Modal */}
      <RNModal visible={pickerOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerOpen(false)}
        >
          <View style={styles.modalContent}>
            <SafeAreaView style={{ maxHeight: 300 }}>
              <FlatList
                data={getPickerData()}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectOption(item.key)}
                    style={styles.modalOption}
                  >
                    <Text style={styles.modalOptionText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
              />
            </SafeAreaView>
          </View>
        </TouchableOpacity>
      </RNModal>
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 12,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#12876a",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0d463a",
  },
  formFields: {
    gap: 10,
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
  typesRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 2,
  },
  typeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#effcf6",
    borderRadius: 12,
    paddingVertical: 10,
  },
  typeButtonActive: {
    backgroundColor: "#12876a",
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  typeButtonTextActive: {
    color: "#ffffff",
  },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#effcf6",
    borderWidth: 1,
    borderColor: "#d9f7ec",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  selectText: {
    fontSize: 14,
    color: "#0d463a",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#f43f5e",
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#12876a",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    paddingVertical: 40,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  iconContainer: {
    backgroundColor: "#effcf6",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0d463a",
  },
  itemMeta: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 320,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0d463a",
  },
  modalSeparator: {
    height: 1,
    backgroundColor: "#effcf6",
  },
});
