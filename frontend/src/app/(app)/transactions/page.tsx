"use client";

import { useEffect, useState } from "react";
import { Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  createTransaction,
  deleteTransaction,
  getCategories,
  getTransactions,
  getWallets,
  type Category,
  type Transaction,
  type TransactionType,
  type Wallet,
} from "@/lib/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function TransactionsPage() {
  const { t: tr } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [walletId, setWalletId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    const [txns, cats, wals] = await Promise.all([
      getTransactions(),
      getCategories(),
      getWallets(),
    ]);
    setTransactions(txns);
    setCategories(cats);
    setWallets(wals);
    if (wals.length > 0) setWalletId(String(wals[0].id));
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openForm(type: TransactionType) {
    setFormType(type);
    setFormOpen(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!amount || !walletId) return;
    setSubmitting(true);
    try {
      await createTransaction({
        amount: parseFloat(amount),
        type: formType,
        description: description || undefined,
        wallet_id: parseInt(walletId, 10),
        category_id: categoryId ? parseInt(categoryId, 10) : undefined,
      });
      setAmount("");
      setDescription("");
      setCategoryId("");
      setFormOpen(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.transactions.addFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  function categoryName(id: number | null): string {
    if (!id) return tr.transactions.uncategorized;
    return categories.find((c) => c.id === id)?.name ?? tr.transactions.uncategorized;
  }

  return (
    <div className="px-4 py-4 md:mx-auto md:max-w-5xl md:px-8 md:py-6">
      {/* Quick actions */}
      <div className="mb-4 flex gap-3 md:max-w-xl">
        <button
          onClick={() => openForm("income")}
          className="flex flex-1 items-center justify-center gap-2 rounded-card bg-white py-3 font-bold text-brand-600 shadow-card"
        >
          <TrendingUp className="h-4 w-4" /> {tr.transactions.income}
        </button>
        <button
          onClick={() => openForm("expense")}
          className="flex flex-1 items-center justify-center gap-2 rounded-card bg-white py-3 font-bold text-rose-500 shadow-card"
        >
          <TrendingDown className="h-4 w-4" /> {tr.transactions.expense}
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 space-y-3 rounded-card bg-white p-4 shadow-card md:max-w-xl"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-brand-900">
              {formType === "income" ? tr.transactions.newIncome : tr.transactions.newExpense}
            </span>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="text-xs font-semibold text-slate-400"
            >
              {tr.transactions.cancel}
            </button>
          </div>

          <input
            type="number"
            step="0.01"
            min="0"
            required
            placeholder={tr.transactions.amountPlaceholder}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
          />

          <input
            type="text"
            placeholder={tr.transactions.descriptionPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
          />

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
          >
            <option value="">{tr.transactions.noCategory}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            required
            className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
          >
            {wallets.length === 0 && <option value="">{tr.transactions.noWalletsYet}</option>}
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {error && <p className="text-xs font-medium text-rose-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !walletId}
            className="bg-brand-gradient w-full rounded-xl py-2.5 font-bold text-white disabled:opacity-60"
          >
            {submitting ? tr.transactions.saving : tr.transactions.save}
          </button>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className="py-8 text-center text-sm text-slate-400">{tr.common.loading}</p>
      ) : transactions.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          {tr.transactions.noTransactions}
        </p>
      ) : (
        <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-card bg-white px-4 py-3 shadow-card"
            >
              <div>
                <p className="font-semibold text-brand-900">
                  {t.description || categoryName(t.category_id)}
                </p>
                <p className="text-xs text-slate-400">
                  {categoryName(t.category_id)} · {formatDate(t.occurred_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-bold ${
                    t.type === "income" ? "text-brand-600" : "text-rose-500"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}${Math.abs(parseFloat(t.amount)).toFixed(2)}
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
  );
}
