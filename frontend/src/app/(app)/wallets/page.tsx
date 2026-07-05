"use client";

import { useEffect, useState } from "react";
import { CreditCard, Landmark, PiggyBank, Plus, TrendingUp, Wallet as WalletIcon } from "lucide-react";
import { createWallet, getWallets, type Wallet } from "@/lib/api";
import { useCurrency } from "@/lib/currency-context";

const WALLET_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit_card", label: "Credit card" },
  { value: "investment", label: "Investment" },
  { value: "loan", label: "Loan" },
];

const ICONS: Record<string, typeof WalletIcon> = {
  cash: WalletIcon,
  checking: Landmark,
  savings: PiggyBank,
  credit_card: CreditCard,
  investment: TrendingUp,
  loan: Landmark,
};

export default function WalletsPage() {
  const { symbol } = useCurrency();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [balance, setBalance] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setWallets(await getWallets());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    setError(null);
    try {
      await createWallet({ name, type, balance: parseFloat(balance) || 0 });
      setName("");
      setType("cash");
      setBalance("0");
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wallet");
    } finally {
      setSubmitting(false);
    }
  }

  const loans = wallets.filter((w) => w.type === "loan");
  const others = wallets.filter((w) => w.type !== "loan");

  return (
    <div className="px-4 py-4 md:mx-auto md:max-w-5xl md:px-8 md:py-6">
      <button
        onClick={() => setFormOpen((v) => !v)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-card bg-white py-3 font-bold text-brand-600 shadow-card md:max-w-xl"
      >
        <Plus className="h-4 w-4" /> Add wallet or loan
      </button>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 space-y-3 rounded-card bg-white p-4 shadow-card md:max-w-xl"
        >
          <input
            type="text"
            placeholder="Name (e.g. Chase Checking)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
          >
            {WALLET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Starting balance"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
          />
          {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-gradient w-full rounded-xl py-2.5 font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
      ) : wallets.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No wallets yet. Add one above to get started.
        </p>
      ) : (
        <>
          {others.length > 0 && (
            <div className="mb-6 space-y-2">
              <h2 className="px-1 text-sm font-bold uppercase text-slate-400">
                Wallets
              </h2>
              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              {others.map((w) => {
                const Icon = ICONS[w.type] ?? WalletIcon;
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-card bg-white px-4 py-3.5 shadow-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-brand-50 p-2 text-brand-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-brand-900">{w.name}</p>
                        <p className="text-xs capitalize text-slate-400">
                          {w.type.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-bold ${
                        parseFloat(w.balance) < 0 ? "text-rose-500" : "text-brand-900"
                      }`}
                    >
                      {symbol}{parseFloat(w.balance).toLocaleString()}
                    </span>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {loans.length > 0 && (
            <div className="space-y-2">
              <h2 className="px-1 text-sm font-bold uppercase text-slate-400">
                Loans
              </h2>
              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              {loans.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-card bg-white px-4 py-3.5 shadow-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-rose-50 p-2 text-rose-500">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <p className="font-semibold text-brand-900">{w.name}</p>
                  </div>
                  <span className="font-bold text-rose-500">
                    {symbol}{Math.abs(parseFloat(w.balance)).toLocaleString()}
                  </span>
                </div>
              ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
