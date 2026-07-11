import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useCurrency } from "../lib/currency-context";

interface AccountCardProps {
  label: string;
  amount: number;
}

export default function AccountCard({ label, amount }: AccountCardProps) {
  const { symbol } = useCurrency();
  const negative = amount < 0;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.amount, negative ? styles.negative : styles.positive]}>
        {negative ? "-" : ""}{symbol}{Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: "#0f5545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f6b56", // brand-700
  },
  amount: {
    fontSize: 18,
    fontWeight: "800",
  },
  positive: {
    color: "#0d463a", // brand-900
  },
  negative: {
    color: "#f43f5e", // rose-500 equivalent
  },
});
