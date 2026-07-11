import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react-native";
import { useLanguage } from "../lib/i18n/language-context";
import type { Language } from "../lib/i18n/translations";
import {
  deleteTransaction,
  getCategories,
  getTransactionTemplates,
  getTransactions,
  getWallets,
  type Category,
  type Transaction,
  type TransactionTemplate,
  type TransactionType,
  type Wallet,
} from "../lib/api";
import { useCurrency } from "../lib/currency-context";
import { getPresetRange, type DatePreset } from "../lib/date-range";
import Modal from "../components/Modal";
import TransactionForm from "../components/TransactionForm";
import TransactionFilters from "../components/TransactionFilters";

const LOCALES: Record<Language, string> = { en: "en-US", es: "es-ES" };

function formatDateTime(iso: string, language: Language): string {
  try {
    return new Date(iso).toLocaleString(LOCALES[language], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (e) {
    return "";
  }
}

export default function TransactionsScreen() {
  const { symbol } = useCurrency();
  const { language, t: tr } = useLanguage();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const [preset, setPreset] = useState<DatePreset>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [walletFilter, setWalletFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10; // fixed page size for clean mobile layout

  // Memoize the date range so it keeps a stable identity across renders.
  // getPresetRange() returns fresh Date objects each call; without memoization
  // start/end change every render, which makes loadData (and the useFocusEffect
  // that calls it) re-run on a loop and the loading spinner never clears.
  const { start, end } = useMemo(
    () => getPresetRange(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txResponse, cats, wals, tmpls] = await Promise.all([
        getTransactions({
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          type: typeFilter || undefined,
          wallet_id: walletFilter ? parseInt(walletFilter, 10) : undefined,
          page,
          page_size: PAGE_SIZE,
        }),
        getCategories(),
        getWallets(),
        getTransactionTemplates(),
      ]);
      setTransactions(txResponse.items);
      setTotalIncome(parseFloat(txResponse.total_income));
      setTotalExpense(parseFloat(txResponse.total_expense));
      setTotalCount(txResponse.total);
      setCategories(cats);
      setWallets(wals);
      setTemplates(tmpls);
    } catch (e) {
      // API call failed
    } finally {
      setLoading(false);
    }
  }, [start, end, typeFilter, walletFilter, page]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    setPage(1);
  }, [preset, customStart, customEnd, typeFilter, walletFilter]);

  async function handleDelete(id: number) {
    try {
      await deleteTransaction(id);
      await loadData();
    } catch (err) {
      // delete failed
    }
  }

  function getCategoryName(id: number | null): string {
    if (!id) return tr.transactions.uncategorized;
    return categories.find((c) => c.id === id)?.name ?? tr.transactions.uncategorized;
  }

  function getWalletName(id: number): string {
    return wallets.find((w) => w.id === id)?.name ?? "";
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <SafeAreaView style={styles.container}>
      {/* Scrollable Main Area */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Filters Panel */}
        <View style={styles.filtersWrapper}>
          <TransactionFilters
            preset={preset}
            onPresetChange={setPreset}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
            type={typeFilter}
            onTypeChange={setTypeFilter}
            walletId={walletFilter}
            onWalletChange={setWalletFilter}
            wallets={wallets}
          />
        </View>

        {/* Income/Expense Totals Summary Box */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>{tr.transactions.totalIncome}</Text>
            <Text style={[styles.summaryVal, styles.incomeText]}>
              {symbol}
              {totalIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>{tr.transactions.totalExpense}</Text>
            <Text style={[styles.summaryVal, styles.expenseText]}>
              {symbol}
              {totalExpense.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Transactions List */}
        <View style={styles.listWrapper}>
          {loading ? (
            <ActivityIndicator size="small" color="#12876a" style={{ marginVertical: 32 }} />
          ) : transactions.length === 0 ? (
            <Text style={styles.emptyText}>{tr.transactions.noTransactions}</Text>
          ) : (
            <View style={styles.listContainer}>
              {transactions.map((t) => {
                const isIncome = t.type === "income";
                const isTransfer = t.type === "transfer";
                return (
                  <View key={t.id} style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {t.description ||
                          (isTransfer
                            ? `${getWalletName(t.wallet_id)} → ${getWalletName(t.to_wallet_id ?? 0)}`
                            : getCategoryName(t.category_id))}
                      </Text>
                      <Text style={styles.itemMeta} numberOfLines={1}>
                        {isTransfer ? tr.transactions.transfer : getCategoryName(t.category_id)} ·{" "}
                        {formatDateTime(t.occurred_at, language)}
                      </Text>
                    </View>
                    <View style={styles.itemRight}>
                      <View style={styles.amountContainer}>
                        {isTransfer && <ArrowLeftRight size={12} color="#64748b" style={styles.transferIcon} />}
                        <Text
                          style={[
                            styles.amountText,
                            isIncome
                              ? styles.incomeText
                              : isTransfer
                                ? styles.transferText
                                : styles.expenseText,
                          ]}
                        >
                          {isIncome ? "+" : t.type === "expense" ? "-" : ""}
                          {symbol}
                          {Math.abs(parseFloat(t.amount)).toFixed(2)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(t.id)}
                        style={styles.deleteButton}
                      >
                        <Trash2 size={16} color="#cbd5e1" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Pagination controls */}
        {!loading && totalCount > 0 && (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
            >
              <ChevronLeft size={16} color={page <= 1 ? "#cbd5e1" : "#64748b"} />
            </TouchableOpacity>
            <Text style={styles.paginationText}>
              {tr.transactions.pageLabel} {page} {tr.transactions.ofLabel} {totalPages}
            </Text>
            <TouchableOpacity
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
            >
              <ChevronRight size={16} color={page >= totalPages ? "#cbd5e1" : "#64748b"} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        onPress={() => setFormOpen(true)}
        style={styles.fab}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* New Transaction Form Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={tr.transactions.newTransaction}>
        <TransactionForm
          wallets={wallets}
          categories={categories}
          templates={templates}
          onCancel={() => setFormOpen(false)}
          onCreated={async () => {
            setFormOpen(false);
            await loadData();
          }}
        />
      </Modal>
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
    paddingBottom: 90, // extra spacing for floating FAB
    gap: 16,
  },
  filtersWrapper: {
    width: "100%",
  },
  summaryContainer: {
    flexDirection: "row",
    gap: 12,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#94a3b8",
  },
  summaryVal: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  incomeText: {
    color: "#1eb489", // brand-500 equivalent
  },
  expenseText: {
    color: "#f43f5e", // rose-500 equivalent
  },
  transferText: {
    color: "#64748b",
  },
  listWrapper: {
    width: "100%",
  },
  listContainer: {
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    paddingVertical: 40,
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
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
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
    gap: 10,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  transferIcon: {
    marginRight: 4,
  },
  amountText: {
    fontSize: 14,
    fontWeight: "800",
  },
  deleteButton: {
    padding: 4,
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  paginationText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#12876a", // primary header gradient stop
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});
