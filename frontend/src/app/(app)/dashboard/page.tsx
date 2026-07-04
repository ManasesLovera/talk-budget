"use client";

import { useEffect, useState } from "react";
import BalanceHeader from "@/components/BalanceHeader";
import AccountCard from "@/components/AccountCard";
import {
  getCategories,
  getTransactions,
  getWallets,
  type Category,
  type Transaction,
  type Wallet,
} from "@/lib/api";

function monthBounds(): { start: string; end: string; label: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const label = now.toLocaleDateString(undefined, { month: "long" });
  return { start: start.toISOString(), end: end.toISOString(), label };
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const { start, end, label } = monthBounds();

  useEffect(() => {
    Promise.all([
      getTransactions({ start_date: start, end_date: end }),
      getCategories(),
      getWallets(),
    ]).then(([txns, cats, wals]) => {
      setTransactions(txns);
      setCategories(cats);
      setWallets(wals);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const left = income - expenses;

  const spendByCategory = new Map<string, number>();
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const name =
        categories.find((c) => c.id === t.category_id)?.name ?? "Uncategorized";
      spendByCategory.set(name, (spendByCategory.get(name) ?? 0) + parseFloat(t.amount));
    });
  const topCategories = Array.from(spendByCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const netWorth = wallets.reduce((sum, w) => sum + parseFloat(w.balance), 0);

  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-400">Loading…</p>;
  }

  return (
    <div className="pb-2">
      <BalanceHeader
        title={`${label} overview`}
        amount={Math.max(left, 0)}
        spent={expenses}
        total={income || expenses || 1}
      />

      <section className="mx-4 -mt-4 rounded-card bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <span className="font-bold text-brand-900">Income</span>
          <span className="font-bold text-brand-500">
            ${income.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-brand-900">Expenses</span>
          <span className="font-bold text-brand-900">
            -${expenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>

        {topCategories.length > 0 && (
          <div className="mt-4 divide-y divide-brand-50">
            <p className="pb-2 text-xs font-semibold uppercase text-slate-400">
              Top spending
            </p>
            {topCategories.map(([name, amount]) => (
              <div key={name} className="flex items-center justify-between py-2.5">
                <span className="font-medium text-brand-900">{name}</span>
                <span className="font-semibold text-slate-500">
                  ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-4 mt-6">
        <h2 className="mb-3 px-1 text-lg font-extrabold text-brand-900">
          Net worth · ${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </h2>
        <div className="space-y-3">
          {wallets.length === 0 ? (
            <p className="text-center text-sm text-slate-400">
              No wallets yet — add one in the Wallets tab.
            </p>
          ) : (
            wallets.map((w) => (
              <AccountCard key={w.id} label={w.name} amount={parseFloat(w.balance)} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
