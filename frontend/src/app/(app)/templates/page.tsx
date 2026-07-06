"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Edit2, Plus, TrendingDown, TrendingUp, Trash2, X } from "lucide-react";
import {
  createTransactionTemplate,
  deleteTransactionTemplate,
  getCategories,
  getTransactionTemplates,
  getWallets,
  updateTransactionTemplate,
  type Category,
  type TransactionTemplate,
  type TransactionType,
  type Wallet,
} from "@/lib/api";
import { useLanguage } from "@/lib/i18n/language-context";

const TYPE_ICONS: Record<TransactionType, typeof TrendingUp> = {
  income: TrendingUp,
  expense: TrendingDown,
  transfer: ArrowLeftRight,
};

export default function TemplatesPage() {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [tmpls, cats, wals] = await Promise.all([
      getTransactionTemplates(),
      getCategories(),
      getWallets(),
    ]);
    setTemplates(tmpls);
    setCategories(cats);
    setWallets(wals);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(template: TransactionTemplate) {
    setEditingId(template.id);
    setName(template.name);
    setType(template.type);
    setAmount(template.amount ?? "");
    setWalletId(template.wallet_id ? String(template.wallet_id) : "");
    setCategoryId(template.category_id ? String(template.category_id) : "");
    setDescription(template.description ?? "");
    setFormOpen(true);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setType("expense");
    setAmount("");
    setWalletId("");
    setCategoryId("");
    setDescription("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name,
        type,
        amount: amount ? parseFloat(amount) : null,
        wallet_id: walletId ? parseInt(walletId, 10) : null,
        category_id: categoryId ? parseInt(categoryId, 10) : null,
        description: description || null,
      };
      if (editingId) {
        await updateTransactionTemplate(editingId, payload);
      } else {
        await createTransactionTemplate(payload);
      }
      resetForm();
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.templates.saveFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteTransactionTemplate(id);
    await load();
  }

  return (
    <div className="px-4 py-4 md:mx-auto md:max-w-5xl md:px-8 md:py-6">
      <button
        onClick={() => {
          resetForm();
          setFormOpen((v) => !v);
        }}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-card bg-white py-3 font-bold text-brand-600 shadow-card md:max-w-xl"
      >
        <Plus className="h-4 w-4" /> {t.templates.addTemplate}
      </button>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 space-y-3 rounded-card bg-white p-4 shadow-card md:max-w-xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-900">
              {editingId ? t.templates.editTemplate : t.templates.newTemplate}
            </h3>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                resetForm();
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <input
            type="text"
            placeholder={t.templates.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
          />

          <div className="flex gap-2">
            {(["expense", "income", "transfer"] as TransactionType[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setType(opt)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors ${
                  type === opt ? "bg-brand-600 text-white" : "bg-brand-50 text-slate-500"
                }`}
              >
                {t.transactions[opt]}
              </button>
            ))}
          </div>

          <input
            type="number"
            step="0.01"
            placeholder={t.templates.amountPlaceholder}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
          />

          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
          >
            <option value="">{t.templates.noWallet}</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {type !== "transfer" && (
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
            >
              <option value="">{t.transactions.noCategory}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            placeholder={t.transactions.descriptionPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
          />

          {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-gradient w-full rounded-xl py-2.5 font-bold text-white disabled:opacity-60"
          >
            {submitting ? t.common.saving : t.common.save}
          </button>
        </form>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-400">{t.common.loading}</p>
      ) : templates.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">{t.templates.noTemplates}</p>
      ) : (
        <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {templates.map((tmpl) => {
            const Icon = TYPE_ICONS[tmpl.type];
            const walletName = wallets.find((w) => w.id === tmpl.wallet_id)?.name;
            const categoryName = categories.find((c) => c.id === tmpl.category_id)?.name;
            return (
              <div
                key={tmpl.id}
                className="flex items-center justify-between rounded-card bg-white px-4 py-3.5 shadow-card"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="rounded-full bg-brand-50 p-2 text-brand-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brand-900">{tmpl.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {[walletName, categoryName].filter(Boolean).join(" • ") || t.templates.noWallet}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => openEdit(tmpl)}
                    className="p-1 text-slate-400 hover:text-brand-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tmpl.id)}
                    aria-label={t.templates.deleteTemplate}
                    className="p-1 text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
