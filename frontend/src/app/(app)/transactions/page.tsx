"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/translations";
import {
  deleteTransaction,
  getCategories,
  getTransactions,
  getWallets,
  type Category,
  type Transaction,
  type TransactionType,
  type Wallet,
} from "@/lib/api";
import { useCurrency } from "@/lib/currency-context";
import { getPresetRange, type DatePreset } from "@/lib/date-range";
import { usePageSize } from "@/lib/use-page-size";
import Modal from "@/components/Modal";
import TransactionForm from "@/components/TransactionForm";
import TransactionFilters from "@/components/TransactionFilters";

const LOCALES: Record<Language, string> = { en: "en-US", es: "es-ES" };

function formatDateTime(iso: string, language: Language): string {
  return new Date(iso).toLocaleString(LOCALES[language], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TransactionsPage() {
  const { symbol } = useCurrency();
  const { language, t: tr } = useLanguage();
  const listRef = useRef<HTMLDivElement>(null);
  const pageSize = usePageSize(listRef);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const [preset, setPreset] = useState<DatePreset>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [walletFilter, setWalletFilter] = useState("");
  const [page, setPage] = useState(1);

  const { start, end } = getPresetRange(preset, customStart, customEnd);

  async function load() {
    setLoading(true);
    const [txResponse, cats, wals] = await Promise.all([
      getTransactions({
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        type: typeFilter || undefined,
        wallet_id: walletFilter ? parseInt(walletFilter, 10) : undefined,
        page,
        page_size: pageSize,
      }),
      getCategories(),
      getWallets(),
    ]);
    setTransactions(txResponse.items);
    setTotalIncome(parseFloat(txResponse.total_income));
    setTotalExpense(parseFloat(txResponse.total_expense));
    setTotalCount(txResponse.total);
    setCategories(cats);
    setWallets(wals);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customStart, customEnd, typeFilter, walletFilter, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [preset, customStart, customEnd, typeFilter, walletFilter]);

  async function handleDelete(id: number) {
    await deleteTransaction(id);
    await load();
  }

  function categoryName(id: number | null): string {
    if (!id) return tr.transactions.uncategorized;
    return categories.find((c) => c.id === id)?.name ?? tr.transactions.uncategorized;
  }

  function walletName(id: number): string {
    return wallets.find((w) => w.id === id)?.name ?? "";
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="relative px-4 py-4 pb-24 md:mx-auto md:max-w-5xl md:px-8 md:py-6 md:pb-24">
      <div className="mb-4 flex items-start justify-between gap-3">
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
        <button
          onClick={() => setFormOpen(true)}
          className="shrink-0 whitespace-nowrap rounded-full bg-brand-600 px-3 py-2 text-xs font-bold text-white shadow-card"
        >
          {tr.transactions.addTransaction}
        </button>
      </div>

      <div className="mb-4 flex gap-3 md:max-w-xl">
        <div className="flex-1 rounded-card bg-white p-3 shadow-card">
          <p className="text-xs text-slate-400">{tr.transactions.totalIncome}</p>
          <p className="mt-1 font-bold text-brand-600">
            {symbol}
            {totalIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex-1 rounded-card bg-white p-3 shadow-card">
          <p className="text-xs text-slate-400">{tr.transactions.totalExpense}</p>
          <p className="mt-1 font-bold text-rose-500">
            {symbol}
            {totalExpense.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* List */}
      <div ref={listRef}>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">{tr.common.loading}</p>
        ) : transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{tr.transactions.noTransactions}</p>
        ) : (
          <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-card bg-white px-4 py-3 shadow-card"
              >
                <div>
                  <p className="font-semibold text-brand-900">
                    {t.description ||
                      (t.type === "transfer"
                        ? `${walletName(t.wallet_id)} → ${walletName(t.to_wallet_id ?? 0)}`
                        : categoryName(t.category_id))}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t.type === "transfer" ? tr.transactions.transfer : categoryName(t.category_id)} ·{" "}
                    {formatDateTime(t.occurred_at, language)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center gap-1 font-bold ${
                      t.type === "income"
                        ? "text-brand-600"
                        : t.type === "transfer"
                          ? "text-slate-500"
                          : "text-rose-500"
                    }`}
                  >
                    {t.type === "transfer" && <ArrowLeftRight className="h-3.5 w-3.5" />}
                    {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}
                    {symbol}
                    {Math.abs(parseFloat(t.amount)).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    aria-label={tr.transactions.deleteTransaction}
                    className="text-slate-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && totalCount > 0 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label={tr.transactions.prevPage}
            className="rounded-full bg-white p-2 text-slate-500 shadow-card disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-slate-400">
            {tr.transactions.pageLabel} {page} {tr.transactions.ofLabel} {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label={tr.transactions.nextPage}
            className="rounded-full bg-white p-2 text-slate-500 shadow-card disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setFormOpen(true)}
        aria-label={tr.transactions.addTransaction}
        className="bg-brand-gradient fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-card md:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Desktop FAB */}
      <button
        onClick={() => setFormOpen(true)}
        aria-label={tr.transactions.addTransaction}
        className="bg-brand-gradient fixed bottom-6 left-64 z-40 hidden h-14 w-14 items-center justify-center rounded-full text-white shadow-card md:flex"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={tr.transactions.newTransaction}>
        <TransactionForm
          wallets={wallets}
          categories={categories}
          onCancel={() => setFormOpen(false)}
          onCreated={async () => {
            setFormOpen(false);
            await load();
          }}
        />
      </Modal>
    </div>
  );
}
