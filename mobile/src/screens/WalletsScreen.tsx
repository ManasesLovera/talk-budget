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
import {
  CreditCard,
  Edit2,
  Landmark,
  PiggyBank,
  Plus,
  TrendingUp,
  Wallet as WalletIcon,
  X,
  ChevronDown,
} from "lucide-react-native";
import {
  createWallet,
  getWallets,
  updateWallet,
  getCategories,
  type Wallet,
  type Category,
} from "../lib/api";
import { useCurrency } from "../lib/currency-context";
import { useLanguage } from "../lib/i18n/language-context";

const ICONS: Record<string, any> = {
  cash: WalletIcon,
  checking: Landmark,
  savings: PiggyBank,
  credit_card: CreditCard,
  investment: TrendingUp,
  loan: Landmark,
};

export default function WalletsScreen() {
  const { symbol } = useCurrency();
  const { t } = useLanguage();

  const WALLET_TYPES = [
    { value: "cash", label: t.wallets.cash },
    { value: "checking", label: t.wallets.checking },
    { value: "savings", label: t.wallets.savings },
    { value: "credit_card", label: t.wallets.creditCard },
    { value: "investment", label: t.wallets.investment },
    { value: "loan", label: t.wallets.loan },
  ];

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [balance, setBalance] = useState("0");
  const [categoryId, setCategoryId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection modala state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<"type" | "category" | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [wals, cats] = await Promise.all([getWallets(), getCategories()]);
      setWallets(wals);
      setCategories(cats);
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

  function openEdit(wallet: Wallet) {
    setEditingId(wallet.id);
    setName(wallet.name);
    setType(wallet.type);
    setBalance(wallet.balance);
    setCategoryId(wallet.category_id ? String(wallet.category_id) : "");
    setFormOpen(true);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setType("cash");
    setBalance("0");
    setCategoryId("");
    setError(null);
  }

  async function handleSubmit() {
    if (!name) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editingId) {
        await updateWallet(editingId, {
          name,
          balance: parseFloat(balance) || 0,
          category_id: categoryId ? parseInt(categoryId) : null,
        });
      } else {
        await createWallet({
          name,
          type,
          balance: parseFloat(balance) || 0,
          category_id: categoryId ? parseInt(categoryId) : null,
        });
      }
      resetForm();
      setFormOpen(false);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingId
            ? t.wallets.saveFailed
            : t.wallets.createFailed
      );
    } finally {
      setSubmitting(false);
    }
  }

  const loans = wallets.filter((w) => w.type === "loan");
  const others = wallets.filter((w) => w.type !== "loan");

  const getTypeName = () => {
    return WALLET_TYPES.find((wt) => wt.value === type)?.label ?? type;
  };

  const getCategoryName = () => {
    return categories.find((c) => String(c.id) === categoryId)?.name ?? t.wallets.noCategory;
  };

  const openPicker = (pType: "type" | "category") => {
    setPickerType(pType);
    setPickerOpen(true);
  };

  const handleSelectOption = (val: string) => {
    if (pickerType === "type") {
      setType(val);
    } else if (pickerType === "category") {
      setCategoryId(val);
    }
    setPickerOpen(false);
    setPickerType(null);
  };

  const getPickerData = () => {
    if (pickerType === "type") {
      return WALLET_TYPES.map((wt) => ({ key: wt.value, label: wt.label }));
    } else {
      return [
        { key: "", label: t.wallets.noCategory },
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
            <Text style={styles.addButtonText}>{t.wallets.addWalletOrLoan}</Text>
          </TouchableOpacity>
        )}

        {/* Create/Edit Form inside screen view */}
        {formOpen && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editingId ? t.wallets.editWallet : t.wallets.newWallet}
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
                placeholder={t.wallets.namePlaceholder}
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />

              {!editingId && (
                <TouchableOpacity onPress={() => openPicker("type")} style={styles.select}>
                  <Text style={styles.selectText}>{getTypeName()}</Text>
                  <ChevronDown size={16} color="#0d463a" />
                </TouchableOpacity>
              )}

              <TextInput
                placeholder={
                  editingId ? t.wallets.balancePlaceholder : t.wallets.startingBalancePlaceholder
                }
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={balance}
                onChangeText={setBalance}
                style={styles.input}
              />

              <TouchableOpacity onPress={() => openPicker("category")} style={styles.select}>
                <Text style={styles.selectText}>{getCategoryName()}</Text>
                <ChevronDown size={16} color="#0d463a" />
              </TouchableOpacity>

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
                    {submitting ? t.wallets.saving : t.wallets.save}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="small" color="#12876a" style={{ marginVertical: 32 }} />
        ) : wallets.length === 0 ? (
          <Text style={styles.emptyText}>{t.wallets.noWallets}</Text>
        ) : (
          <>
            {/* Wallets Group */}
            {others.length > 0 && (
              <View style={styles.groupContainer}>
                <Text style={styles.groupHeader}>{t.wallets.walletsHeader}</Text>
                <View style={styles.itemsList}>
                  {others.map((w) => {
                    const Icon = ICONS[w.type] ?? WalletIcon;
                    const typeLabel =
                      WALLET_TYPES.find((wt) => wt.value === w.type)?.label ??
                      w.type.replace("_", " ");
                    const categoryName = w.category_id
                      ? categories.find((c) => c.id === w.category_id)?.name
                      : undefined;
                    const balanceNum = parseFloat(w.balance);
                    return (
                      <View key={w.id} style={styles.itemRow}>
                        <View style={styles.itemLeft}>
                          <View style={styles.iconContainer}>
                            <Icon size={16} color="#12876a" />
                          </View>
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={1}>{w.name}</Text>
                            <Text style={styles.itemMeta} numberOfLines={1}>
                              {typeLabel}
                              {categoryName && ` • ${categoryName}`}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.itemRight}>
                          <Text
                            style={[
                              styles.itemBalance,
                              balanceNum < 0 ? styles.negativeBalance : styles.positiveBalance,
                            ]}
                          >
                            {symbol}
                            {balanceNum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </Text>
                          <TouchableOpacity onPress={() => openEdit(w)} style={styles.editButton}>
                            <Edit2 size={14} color="#94a3b8" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Loans Group */}
            {loans.length > 0 && (
              <View style={[styles.groupContainer, { marginTop: 16 }]}>
                <Text style={styles.groupHeader}>{t.wallets.loansHeader}</Text>
                <View style={styles.itemsList}>
                  {loans.map((w) => {
                    const balanceNum = Math.abs(parseFloat(w.balance));
                    return (
                      <View key={w.id} style={styles.itemRow}>
                        <View style={styles.itemLeft}>
                          <View style={[styles.iconContainer, { backgroundColor: "#fee2e2" }]}>
                            <Landmark size={16} color="#ef4444" />
                          </View>
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={1}>{w.name}</Text>
                            <Text style={styles.itemMeta}>{t.wallets.loan}</Text>
                          </View>
                        </View>
                        <View style={styles.itemRight}>
                          <Text style={[styles.itemBalance, styles.negativeBalance]}>
                            {symbol}
                            {balanceNum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </Text>
                          <TouchableOpacity onPress={() => openEdit(w)} style={styles.editButton}>
                            <Edit2 size={14} color="#94a3b8" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
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
  groupContainer: {
    width: "100%",
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    paddingLeft: 4,
    marginBottom: 8,
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
    textTransform: "capitalize",
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemBalance: {
    fontSize: 14,
    fontWeight: "800",
  },
  positiveBalance: {
    color: "#0d463a",
  },
  negativeBalance: {
    color: "#f43f5e",
  },
  editButton: {
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
