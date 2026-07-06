"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, TrendingDown, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  createTransaction,
  type Category,
  type Transaction,
  type TransactionTemplate,
  type TransactionType,
  type Wallet,
} from "@/lib/api";

function nowForInput(): string {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

interface TransactionFormProps {
  wallets: Wallet[];
  categories: Category[];
  templates?: TransactionTemplate[];
  onCreated: (transaction: Transaction) => void;
  onCancel: () => void;
}

export default function TransactionForm({
  wallets,
  categories,
  templates = [],
  onCreated,
  onCancel,
}: TransactionFormProps) {
  const { t: tr } = useLanguage();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState(wallets[0] ? String(wallets[0].id) : "");
  const [toWalletId, setToWalletId] = useState("");
  const [occurredAt, setOccurredAt] = useState(nowForInput());
  const [templateId, setTemplateId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletId && wallets[0]) {
      setWalletId(String(wallets[0].id));
    }
  }, [wallets, walletId]);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const template = templates.find((t) => String(t.id) === id);
    if (!template) return;
    setType(template.type);
    if (template.amount != null) setAmount(template.amount);
    setDescription(template.description ?? "");
    setCategoryId(template.category_id ? String(template.category_id) : "");
    if (template.wallet_id) setWalletId(String(template.wallet_id));
  }

  const typeOptions: { key: TransactionType; label: string; icon: React.ReactNode }[] = [
    { key: "expense", label: tr.transactions.expense, icon: <TrendingDown className="h-4 w-4" /> },
    { key: "income", label: tr.transactions.income, icon: <TrendingUp className="h-4 w-4" /> },
    { key: "transfer", label: tr.transactions.transfer, icon: <ArrowLeftRight className="h-4 w-4" /> },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!amount || !walletId) return;
    if (type === "transfer" && (!toWalletId || toWalletId === walletId)) {
      setError(tr.transactions.toWalletSameError);
      return;
    }
    setSubmitting(true);
    try {
      const transaction = await createTransaction({
        amount: parseFloat(amount),
        type,
        description: description || undefined,
        wallet_id: parseInt(walletId, 10),
        to_wallet_id: type === "transfer" ? parseInt(toWalletId, 10) : undefined,
        category_id: type !== "transfer" && categoryId ? parseInt(categoryId, 10) : undefined,
        occurred_at: new Date(occurredAt).toISOString(),
      });
      onCreated(transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.transactions.addFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {templates.length > 0 && (
        <select
          value={templateId}
          onChange={(e) => applyTemplate(e.target.value)}
          className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
        >
          <option value="">{tr.transactions.useTemplate}</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}

      <div className="flex gap-2">
        {typeOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setType(opt.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors ${
              type === opt.key
                ? "bg-brand-600 text-white"
                : "bg-brand-50 text-slate-500"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
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

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-400">
          {tr.transactions.dateTimeLabel}
        </label>
        <input
          type="datetime-local"
          required
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
        />
      </div>

      <input
        type="text"
        placeholder={tr.transactions.descriptionPlaceholder}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
      />

      <div>
        {type === "transfer" && (
          <label className="mb-1 block text-xs font-semibold text-slate-400">
            {tr.transactions.fromWallet}
          </label>
        )}
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
      </div>

      {type === "transfer" ? (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">
            {tr.transactions.toWallet}
          </label>
          <select
            value={toWalletId}
            onChange={(e) => setToWalletId(e.target.value)}
            required
            className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
          >
            <option value="">{tr.transactions.toWallet}</option>
            {wallets
              .filter((w) => String(w.id) !== walletId)
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
          </select>
        </div>
      ) : (
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
      )}

      {error && <p className="text-xs font-medium text-rose-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-slate-100 py-2.5 font-bold text-slate-500"
        >
          {tr.transactions.cancel}
        </button>
        <button
          type="submit"
          disabled={submitting || !walletId}
          className="bg-brand-gradient flex-1 rounded-xl py-2.5 font-bold text-white disabled:opacity-60"
        >
          {submitting ? tr.transactions.saving : tr.transactions.save}
        </button>
      </div>
    </form>
  );
}
