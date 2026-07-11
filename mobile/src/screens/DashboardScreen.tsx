import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ChevronRight, X } from "lucide-react-native";
import AccountCard from "../components/AccountCard";
import DonutChart from "../components/DonutChart";
import { useLanguage } from "../lib/i18n/language-context";
import type { Language } from "../lib/i18n/translations";
import {
  getCategories,
  getTransactions,
  getWallets,
  type Category,
  type Transaction,
  type Wallet,
} from "../lib/api";
import { useCurrency } from "../lib/currency-context";

type DateFilter = "today" | "month" | "year" | "custom";

const LOCALES: Record<Language, string> = { en: "en-US", es: "es-ES" };

function getTodayBounds(language: Language): { start: string; end: string; label: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const label = now.toLocaleDateString(LOCALES[language], { month: "short", day: "numeric", year: "numeric" });
  return { start: start.toISOString(), end: end.toISOString(), label };
}

function getMonthBounds(language: Language): { start: string; end: string; label: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const label = now.toLocaleDateString(LOCALES[language], { month: "long", year: "numeric" });
  return { start: start.toISOString(), end: end.toISOString(), label };
}

function getYearBounds(): { start: string; end: string; label: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  const label = now.getFullYear().toString();
  return { start: start.toISOString(), end: end.toISOString(), label };
}

function getCustomBounds(
  startDate: string,
  endDate: string,
  language: Language,
): { start: string; end: string; label: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59);
  const startLabel = start.toLocaleDateString(LOCALES[language], { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(LOCALES[language], { month: "short", day: "numeric", year: "numeric" });
  const label = `${startLabel} - ${endLabel}`;
  return { start: start.toISOString(), end: end.toISOString(), label };
}

const SEGMENT_COLORS = ["#2a78d6", "#1baf7a", "#eda100", "#008300"];
const OTHERS_COLOR = "#4a3aa7";

function money(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { symbol } = useCurrency();
  const { language, t: tr } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const getDateBounds = () => {
    switch (dateFilter) {
      case "today":
        return getTodayBounds(language);
      case "year":
        return getYearBounds();
      case "custom":
        return customStart && customEnd
          ? getCustomBounds(customStart, customEnd, language)
          : getMonthBounds(language);
      case "month":
      default:
        return getMonthBounds(language);
    }
  };

  const { start, end, label } = getDateBounds();

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      getTransactions({ start_date: start, end_date: end, page_size: 1000 }),
      getCategories(),
      getWallets(),
    ])
      .then(([txnsResponse, cats, wals]) => {
        setTransactions(txnsResponse.items);
        setCategories(cats);
        setWallets(wals);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [start, end]);

  // Refresh dashboard data when screen receives focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const netWorth = wallets.reduce((sum, w) => sum + parseFloat(w.balance), 0);
  const endingBalance = netWorth;
  const openingBalance = netWorth - (income - expenses);

  const spendByCategory = new Map<string, number>();
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const name =
        categories.find((c) => c.id === t.category_id)?.name ?? tr.dashboard.uncategorized;
      spendByCategory.set(name, (spendByCategory.get(name) ?? 0) + parseFloat(t.amount));
    });
  const ranked = Array.from(spendByCategory.entries()).sort((a, b) => b[1] - a[1]);
  const topFour = ranked.slice(0, 4);
  const rest = ranked.slice(4);
  const othersTotal = rest.reduce((sum, [, amount]) => sum + amount, 0);

  const segments = [
    ...topFour.map(([name, amount], i) => ({
      label: name,
      value: amount,
      color: SEGMENT_COLORS[i],
    })),
    ...(othersTotal > 0 ? [{ label: tr.dashboard.others, value: othersTotal, color: OTHERS_COLOR }] : []),
  ];

  const filterOptions: { key: DateFilter; label: string }[] = [
    { key: "today", label: tr.dashboard.filterToday },
    { key: "month", label: tr.dashboard.filterMonth },
    { key: "year", label: tr.dashboard.filterYear },
    { key: "custom", label: tr.dashboard.filterCustom },
  ];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#12876a" />
        <Text style={styles.loadingText}>{tr.common.loading}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Date Filter selector pills */}
      <View style={styles.filtersRow}>
        {filterOptions.map((opt) => {
          const isActive = dateFilter === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setDateFilter(opt.key)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom range input boxes */}
      {dateFilter === "custom" && (
        <View style={styles.customRangeCard}>
          <TextInput
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
            value={customStart}
            onChangeText={setCustomStart}
            style={styles.customInput}
          />
          <Text style={styles.rangeText}>{tr.dashboard.filterTo}</Text>
          <TextInput
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
            value={customEnd}
            onChangeText={setCustomEnd}
            style={styles.customInput}
          />
          {(customStart || customEnd) && (
            <TouchableOpacity
              onPress={() => {
                setCustomStart("");
                setCustomEnd("");
              }}
              style={styles.clearBtn}
            >
              <X size={14} color="#94a3b8" />
              <Text style={styles.clearText}>{tr.dashboard.filterClear}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Date label */}
      <Text style={styles.dateLabel}>{label}</Text>

      {/* Link Card: Balance */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Wallets")}
        style={styles.linkCard}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{tr.dashboard.balance}</Text>
          <ChevronRight size={18} color="#cbd5e1" />
        </View>
        <View style={styles.balanceGrid}>
          <View style={styles.balanceCol}>
            <Text style={styles.balanceLabel}>{tr.dashboard.openingBalance}</Text>
            <Text style={styles.balanceValue}>
              {symbol}
              {openingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.balanceCol}>
            <Text style={styles.balanceLabel}>{tr.dashboard.endingBalance}</Text>
            <Text style={styles.balanceValue}>
              {symbol}
              {endingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expense Structure Card */}
      <View style={styles.structureCard}>
        <Text style={styles.cardTitle}>{tr.dashboard.expenseStructure}</Text>
        {segments.length === 0 ? (
          <Text style={styles.emptyExpenses}>{tr.dashboard.noExpenses}</Text>
        ) : (
          <View style={styles.structureContent}>
            <View style={styles.chartWrapper}>
              <DonutChart
                segments={segments}
                centerLabel={tr.dashboard.expense}
                centerValue={`${symbol}${money(expenses)}`}
                size={130}
                strokeWidth={20}
              />
            </View>
            <View style={styles.segmentsList}>
              {segments.map((s) => (
                <View key={s.label} style={styles.segmentRow}>
                  <View style={styles.segmentDotLabel}>
                    <View style={[styles.segmentDot, { backgroundColor: s.color }]} />
                    <Text style={styles.segmentName} numberOfLines={1}>{s.label}</Text>
                  </View>
                  <Text style={styles.segmentPct}>
                    {expenses > 0 ? ((s.value / expenses) * 100).toFixed(1) : "0"}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Show more rest items */}
        {rest.length > 0 && (
          <View style={styles.showMoreContainer}>
            {showMore && (
              <View style={styles.showMoreList}>
                {rest.map(([name, amount]) => (
                  <View key={name} style={styles.showMoreRow}>
                    <View style={styles.segmentDotLabel}>
                      <View style={[styles.segmentDot, { backgroundColor: OTHERS_COLOR }]} />
                      <Text style={styles.segmentName}>{name}</Text>
                    </View>
                    <Text style={styles.showMoreAmount}>
                      {symbol}
                      {money(amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity onPress={() => setShowMore((v) => !v)} style={styles.showMoreBtn}>
              <Text style={styles.showMoreBtnText}>
                {showMore ? tr.dashboard.showLess : tr.dashboard.showMore}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Link Card: Summary */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Transactions")}
        style={styles.linkCard}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{tr.dashboard.summary}</Text>
          <ChevronRight size={18} color="#cbd5e1" />
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{tr.dashboard.income}</Text>
          <Text style={[styles.summaryVal, { color: "#1eb489" }]}>
            {symbol}
            {money(income)}
          </Text>
        </View>
        <View style={[styles.summaryRow, { marginTop: 8 }]}>
          <Text style={styles.summaryLabel}>{tr.dashboard.expense}</Text>
          <Text style={[styles.summaryVal, { color: "#0d463a" }]}>
            -{symbol}
            {money(expenses)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Net Worth section */}
      <View style={styles.netWorthHeaderContainer}>
        <Text style={styles.netWorthHeader}>
          {tr.dashboard.netWorth} · {symbol}
          {money(netWorth)}
        </Text>
      </View>
      <View style={styles.walletsList}>
        {wallets.length === 0 ? (
          <Text style={styles.emptyWallets}>{tr.dashboard.noWallets}</Text>
        ) : (
          wallets.map((w) => (
            <AccountCard key={w.id} label={w.name} amount={parseFloat(w.balance)} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#effcf6", // brand-50 app canvas background
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
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
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: "#12876a", // brand-600
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  filterTextActive: {
    color: "#ffffff",
  },
  customRangeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 16,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d9f7ec",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    color: "#0d463a",
    backgroundColor: "#effcf6",
    textAlign: "center",
  },
  rangeText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    gap: 2,
  },
  clearText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    paddingLeft: 4,
    marginTop: -4,
  },
  linkCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0d463a",
  },
  balanceGrid: {
    flexDirection: "row",
    gap: 24,
  },
  balanceCol: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 11,
    color: "#94a3b8",
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0d463a",
    marginTop: 4,
  },
  structureCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyExpenses: {
    textAlign: "center",
    paddingVertical: 24,
    fontSize: 14,
    color: "#94a3b8",
  },
  structureContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 10,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  segmentsList: {
    flex: 1,
    gap: 10,
  },
  segmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  segmentDotLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  segmentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  segmentName: {
    fontSize: 13,
    color: "#0d463a",
    fontWeight: "500",
    flex: 1,
  },
  segmentPct: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  showMoreContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#effcf6",
    paddingTop: 12,
  },
  showMoreList: {
    gap: 8,
    marginBottom: 8,
  },
  showMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  showMoreAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  showMoreBtn: {
    paddingVertical: 4,
  },
  showMoreBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#12876a",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#0d463a",
  },
  summaryVal: {
    fontSize: 15,
    fontWeight: "700",
  },
  netWorthHeaderContainer: {
    paddingLeft: 4,
    marginTop: 8,
  },
  netWorthHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0d463a",
  },
  walletsList: {
    gap: 4,
  },
  emptyWallets: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    paddingVertical: 12,
  },
});
