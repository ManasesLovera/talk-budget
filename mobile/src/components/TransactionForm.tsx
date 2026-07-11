import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { ArrowLeftRight, TrendingDown, TrendingUp, ChevronDown } from "lucide-react-native";
import { useLanguage } from "../lib/i18n/language-context";
import {
  createTransaction,
  type Category,
  type Transaction,
  type TransactionTemplate,
  type TransactionType,
  type Wallet,
} from "../lib/api";

function nowForInput(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${date} ${hours}:${minutes}`;
}

interface TransactionFormProps {
  wallets: Wallet[];
  categories: Category[];
  templates?: TransactionTemplate[];
  onCreated: (transaction: Transaction) => void;
  onCancel: () => void;
}

export default function TransactionForm({
  wallets,
  categories,
  templates = [],
  onCreated,
  onCancel,
}: TransactionFormProps) {
  const { t: tr } = useLanguage();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState(wallets[0] ? String(wallets[0].id) : "");
  const [toWalletId, setToWalletId] = useState("");
  const [occurredAt, setOccurredAt] = useState(nowForInput());
  const [templateId, setTemplateId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection modal state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<"template" | "wallet" | "toWallet" | "category" | null>(null);

  useEffect(() => {
    if (!walletId && wallets[0]) {
      setWalletId(String(wallets[0].id));
    }
  }, [wallets, walletId]);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const template = templates.find((t) => String(t.id) === id);
    if (!template) return;
    setType(template.type);
    if (template.amount != null) setAmount(template.amount);
    setDescription(template.description ?? "");
    setCategoryId(template.category_id ? String(template.category_id) : "");
    if (template.wallet_id) setWalletId(String(template.wallet_id));
  }

  const typeOptions: { key: TransactionType; label: string; icon: React.ReactNode }[] = [
    { key: "expense", label: tr.transactions.expense, icon: <TrendingDown size={14} color="#ffffff" /> },
    { key: "income", label: tr.transactions.income, icon: <TrendingUp size={14} color="#ffffff" /> },
    { key: "transfer", label: tr.transactions.transfer, icon: <ArrowLeftRight size={14} color="#ffffff" /> },
  ];

  async function handleSubmit() {
    setError(null);
    if (!amount || !walletId) return;
    if (type === "transfer" && (!toWalletId || toWalletId === walletId)) {
      setError(tr.transactions.toWalletSameError);
      return;
    }
    setSubmitting(true);
    try {
      // Parse datetime input: replace space with T to make it ISO-compliant, or parse using Date
      const isoDateTimeString = occurredAt.replace(" ", "T");
      const transaction = await createTransaction({
        amount: parseFloat(amount),
        type,
        description: description || undefined,
        wallet_id: parseInt(walletId, 10),
        to_wallet_id: type === "transfer" ? parseInt(toWalletId, 10) : undefined,
        category_id: type !== "transfer" && categoryId ? parseInt(categoryId, 10) : undefined,
        occurred_at: new Date(isoDateTimeString).toISOString(),
      });
      onCreated(transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.transactions.addFailed);
    } finally {
      setSubmitting(false);
    }
  }

  const getTemplateName = () => {
    return templates.find((t) => String(t.id) === templateId)?.name ?? tr.transactions.useTemplate;
  };

  const getWalletName = () => {
    return wallets.find((w) => String(w.id) === walletId)?.name ?? tr.transactions.noWalletsYet;
  };

  const getToWalletName = () => {
    return wallets.find((w) => String(w.id) === toWalletId)?.name ?? tr.transactions.toWallet;
  };

  const getCategoryName = () => {
    return categories.find((c) => String(c.id) === categoryId)?.name ?? tr.transactions.noCategory;
  };

  const openPicker = (pType: "template" | "wallet" | "toWallet" | "category") => {
    setPickerType(pType);
    setPickerOpen(true);
  };

  const handleSelectOption = (val: string) => {
    if (pickerType === "template") {
      applyTemplate(val);
    } else if (pickerType === "wallet") {
      setWalletId(val);
      if (toWalletId === val) setToWalletId("");
    } else if (pickerType === "toWallet") {
      setToWalletId(val);
    } else if (pickerType === "category") {
      setCategoryId(val);
    }
    setPickerOpen(false);
    setPickerType(null);
  };

  const getPickerData = () => {
    switch (pickerType) {
      case "template":
        return [
          { key: "", label: tr.transactions.useTemplate },
          ...templates.map((t) => ({ key: String(t.id), label: t.name })),
        ];
      case "wallet":
        return wallets.map((w) => ({ key: String(w.id), label: w.name }));
      case "toWallet":
        return [
          { key: "", label: tr.transactions.toWallet },
          ...wallets
            .filter((w) => String(w.id) !== walletId)
            .map((w) => ({ key: String(w.id), label: w.name })),
        ];
      case "category":
        return [
          { key: "", label: tr.transactions.noCategory },
          ...categories.map((c) => ({ key: String(c.id), label: c.name })),
        ];
      default:
        return [];
    }
  };

  return (
    <View style={styles.form}>
      {/* Templates select */}
      {templates.length > 0 && (
        <TouchableOpacity onPress={() => openPicker("template")} style={styles.select}>
          <Text style={styles.selectText}>{getTemplateName()}</Text>
          <ChevronDown size={16} color="#0d463a" />
        </TouchableOpacity>
      )}

      {/* Type switch buttons */}
      <View style={styles.typesRow}>
        {typeOptions.map((opt) => {
          const isActive = type === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setType(opt.key)}
              style={[styles.typeButton, isActive && styles.typeButtonActive]}
            >
              {opt.icon}
              <Text style={[styles.typeButtonText, isActive && styles.typeButtonTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Amount input */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={tr.transactions.amountPlaceholder}
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
        />
      </View>

      {/* DateTime input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{tr.transactions.dateTimeLabel}</Text>
        <TextInput
          placeholder="YYYY-MM-DD HH:MM"
          placeholderTextColor="#94a3b8"
          value={occurredAt}
          onChangeText={setOccurredAt}
          style={[styles.input, { fontSize: 14 }]}
        />
      </View>

      {/* Description input */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={tr.transactions.descriptionPlaceholder}
          placeholderTextColor="#94a3b8"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
        />
      </View>

      {/* Source Wallet selector */}
      <View style={styles.inputContainer}>
        {type === "transfer" && <Text style={styles.inputLabel}>{tr.transactions.fromWallet}</Text>}
        <TouchableOpacity onPress={() => openPicker("wallet")} style={styles.select}>
          <Text style={styles.selectText}>{getWalletName()}</Text>
          <ChevronDown size={16} color="#0d463a" />
        </TouchableOpacity>
      </View>

      {/* Destination Wallet or Category selector */}
      {type === "transfer" ? (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{tr.transactions.toWallet}</Text>
          <TouchableOpacity onPress={() => openPicker("toWallet")} style={styles.select}>
            <Text style={styles.selectText}>{getToWalletName()}</Text>
            <ChevronDown size={16} color="#0d463a" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => openPicker("category")} style={styles.select}>
            <Text style={styles.selectText}>{getCategoryName()}</Text>
            <ChevronDown size={16} color="#0d463a" />
          </TouchableOpacity>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>{tr.transactions.cancel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || !walletId || !amount}
          style={[styles.saveButton, (submitting || !walletId || !amount) && styles.saveButtonDisabled]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>{tr.transactions.save}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Option Picker Modal */}
      <Modal visible={pickerOpen} transparent animationType="fade">
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
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#effcf6", // brand-50
    borderWidth: 1,
    borderColor: "#d9f7ec", // brand-100
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 14,
    color: "#0d463a",
    fontWeight: "500",
  },
  typesRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#effcf6",
    borderRadius: 12,
    paddingVertical: 10,
  },
  typeButtonActive: {
    backgroundColor: "#12876a", // brand-600
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  typeButtonTextActive: {
    color: "#ffffff",
  },
  inputContainer: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
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
    paddingVertical: 12,
    fontSize: 15,
    color: "#0d463a",
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#f43f5e",
    textAlign: "center",
    marginVertical: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#12876a",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
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
