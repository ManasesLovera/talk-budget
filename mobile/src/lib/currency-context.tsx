import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CurrencyCode = "USD" | "DOP";

const SYMBOLS: Record<CurrencyCode, string> = {
  USD: "US$",
  DOP: "RD$",
};

const STORAGE_KEY = "talk_budget_currency";

interface CurrencyContextValue {
  currency: CurrencyCode;
  symbol: string;
  setCurrency: (currency: CurrencyCode) => void;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "USD" || stored === "DOP") {
        setCurrencyState(stored as CurrencyCode);
      }
      setLoading(false);
    });
  }, []);

  const setCurrency = async (next: CurrencyCode) => {
    setCurrencyState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <CurrencyContext.Provider value={{ currency, symbol: SYMBOLS[currency], setCurrency, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
