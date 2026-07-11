import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { useLanguage } from "../lib/i18n/language-context";
import type { DatePreset } from "../lib/date-range";
import type { TransactionType, Wallet } from "../lib/api";
import { ChevronDown } from "lucide-react-native";

interface TransactionFiltersProps {
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  type: TransactionType | "";
  onTypeChange: (type: TransactionType | "") => void;
  walletId: string;
  onWalletChange: (walletId: string) => void;
  wallets: Wallet[];
}

export default function TransactionFilters({
  preset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  type,
  onTypeChange,
  walletId,
  onWalletChange,
  wallets,
}: TransactionFiltersProps) {
  const { t: tr } = useLanguage();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<"type" | "wallet" | null>(null);

  const presetOptions: { key: DatePreset; label: string }[] = [
    { key: "today", label: tr.transactions.filterToday },
    { key: "yesterday", label: tr.transactions.filterYesterday },
    { key: "thisWeek", label: tr.transactions.filterThisWeek },
    { key: "thisMonth", label: tr.transactions.filterThisMonth },
    { key: "custom", label: tr.transactions.filterCustom },
  ];

  const typeOptions: { key: TransactionType | ""; label: string }[] = [
    { key: "", label: tr.transactions.filterAllTypes },
    { key: "income", label: tr.transactions.income },
    { key: "expense", label: tr.transactions.expense },
    { key: "transfer", label: tr.transactions.transfer },
  ];

  const getActiveWalletName = () => {
    if (!walletId) return tr.transactions.filterAllWallets;
    return wallets.find((w) => String(w.id) === walletId)?.name ?? tr.transactions.filterAllWallets;
  };

  const getActiveTypeName = () => {
    return typeOptions.find((t) => t.key === type)?.label ?? tr.transactions.filterAllTypes;
  };

  const openOptionPicker = (picker: "type" | "wallet") => {
    setPickerType(picker);
    setPickerOpen(true);
  };

  const handleSelectOption = (value: string) => {
    if (pickerType === "type") {
      onTypeChange(value as TransactionType | "");
    } else if (pickerType === "wallet") {
      onWalletChange(value);
    }
    setPickerOpen(false);
    setPickerType(null);
  };

  const pickerData = pickerType === "type"
    ? typeOptions.map((opt) => ({ key: opt.key, label: opt.label }))
    : [
        { key: "", label: tr.transactions.filterAllWallets },
        ...wallets.map((w) => ({ key: String(w.id), label: w.name })),
      ];

  return (
    <View style={styles.container}>
      {/* Scrollable preset options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetsScroll}
      >
        {presetOptions.map((opt) => {
          const isActive = preset === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => onPresetChange(opt.key)}
              style={[styles.presetButton, isActive && styles.presetButtonActive]}
            >
              <Text style={[styles.presetText, isActive && styles.presetTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Custom date range fields */}
      {preset === "custom" && (
        <View style={styles.customDateContainer}>
          <TextInput
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
            value={customStart}
            onChangeText={onCustomStartChange}
            style={styles.dateInput}
          />
          <Text style={styles.dateSeparator}>{tr.transactions.filterTo}</Text>
          <TextInput
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
            value={customEnd}
            onChangeText={onCustomEndChange}
            style={styles.dateInput}
          />
        </View>
      )}

      {/* Filter selects */}
      <View style={styles.selectsContainer}>
        <TouchableOpacity
          onPress={() => openOptionPicker("type")}
          style={styles.selectButton}
        >
          <Text style={styles.selectButtonText} numberOfLines={1}>
            {getActiveTypeName()}
          </Text>
          <ChevronDown size={14} color="#0d463a" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openOptionPicker("wallet")}
          style={styles.selectButton}
        >
          <Text style={styles.selectButtonText} numberOfLines={1}>
            {getActiveWalletName()}
          </Text>
          <ChevronDown size={14} color="#0d463a" />
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
                data={pickerData}
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
  container: {
    gap: 8,
    flex: 1,
  },
  presetsScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9f7ec", // brand-100
  },
  presetButtonActive: {
    backgroundColor: "#12876a", // brand-600
    borderColor: "#12876a",
  },
  presetText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b", // slate-500 equivalent
  },
  presetTextActive: {
    color: "#ffffff",
  },
  customDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 12,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    gap: 8,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#effcf6", // brand-50
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: "#0d463a",
    backgroundColor: "#effcf6",
    textAlign: "center",
  },
  dateSeparator: {
    fontSize: 13,
    color: "#94a3b8",
  },
  selectsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  selectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#effcf6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0d463a", // brand-900
    flex: 1,
    marginRight: 4,
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
  modalSeparatorText: {
    height: 1,
  },
});
