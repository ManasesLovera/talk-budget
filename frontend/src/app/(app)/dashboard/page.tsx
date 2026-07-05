"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AccountCard from "@/components/AccountCard";
import DonutChart from "@/components/DonutChart";
import { useLanguage } from "@/lib/i18n/language-context";
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
  const label = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return { start: start.toISOString(), end: end.toISOString(), label };
}

// Fixed categorical order (never cycled) — first four ranked categories get
// their own slot, the rest fold into "Others".
const SEGMENT_COLORS = ["#2a78d6", "#1baf7a", "#eda100", "#008300"];
const OTHERS_COLOR = "#4a3aa7";

function money(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function DashboardPage() {
  const { t: tr } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
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

  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-400">{tr.common.loading}</p>;
  }

  return (
    <div className="space-y-4 px-4 py-4 md:mx-auto md:max-w-5xl md:px-8 md:py-6">
      <p className="px-1 text-sm font-semibold text-slate-400">{label}</p>

      <div className="space-y-4 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
      <div className="space-y-4">
      {/* Balance */}
      <Link
        href="/wallets"
        className="block rounded-card bg-white p-4 shadow-card"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-bold text-brand-900">{tr.dashboard.balance}</span>
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-slate-400">{tr.dashboard.openingBalance}</p>
            <p className="mt-1 font-bold text-brand-900">
              ${openingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">{tr.dashboard.endingBalance}</p>
            <p className="mt-1 font-bold text-brand-900">
              ${endingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </Link>

      {/* Expense structure */}
      <section className="rounded-card bg-white p-4 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-bold text-brand-900">{tr.dashboard.expenseStructure}</span>
        </div>

        {segments.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            {tr.dashboard.noExpenses}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-5">
              <DonutChart
                segments={segments}
                centerLabel={tr.dashboard.expense}
                centerValue={`$${money(expenses)}`}
              />
              <div className="flex-1 space-y-2.5">
                {segments.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-brand-900">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.label}
                    </span>
                    <span className="font-semibold text-slate-500">
                      {expenses > 0 ? ((s.value / expenses) * 100).toFixed(1) : "0"}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {rest.length > 0 && (
              <>
                {showMore && (
                  <div className="mt-3 space-y-2 border-t border-brand-50 pt-3">
                    {rest.map(([name, amount]) => (
                      <div key={name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-brand-900">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: OTHERS_COLOR }}
                          />
                          {name}
                        </span>
                        <span className="font-semibold text-slate-500">${money(amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowMore((v) => !v)}
                  className="mt-3 text-xs font-semibold text-brand-600"
                >
                  {showMore ? tr.dashboard.showLess : tr.dashboard.showMore}
                </button>
              </>
            )}
          </>
        )}
      </section>
      </div>

      <div className="space-y-4">
      {/* Summary */}
      <Link
        href="/transactions"
        className="block rounded-card bg-white p-4 shadow-card"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-bold text-brand-900">{tr.dashboard.summary}</span>
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-brand-900">{tr.dashboard.income}</span>
          <span className="font-bold text-brand-500">${money(income)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-brand-900">{tr.dashboard.expense}</span>
          <span className="font-bold text-brand-900">-${money(expenses)}</span>
        </div>
      </Link>

      {/* Net worth */}
      <section>
        <h2 className="mb-3 px-1 text-lg font-extrabold text-brand-900">
          {tr.dashboard.netWorth} · ${money(netWorth)}
        </h2>
        <div className="space-y-3">
          {wallets.length === 0 ? (
            <p className="text-center text-sm text-slate-400">
              {tr.dashboard.noWallets}
            </p>
          ) : (
            wallets.map((w) => (
              <AccountCard key={w.id} label={w.name} amount={parseFloat(w.balance)} />
            ))
          )}
        </div>
      </section>
      </div>
      </div>
    </div>
  );
}
