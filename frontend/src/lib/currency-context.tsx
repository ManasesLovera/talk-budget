"use client";

import { createContext, useContext, useEffect, useState } from "react";

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
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "USD" || stored === "DOP") setCurrencyState(stored);
  }, []);

  function setCurrency(next: CurrencyCode) {
    setCurrencyState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <CurrencyContext.Provider value={{ currency, symbol: SYMBOLS[currency], setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
