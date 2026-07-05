"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import type { DatePreset } from "@/lib/date-range";
import type { TransactionType, Wallet } from "@/lib/api";

interface TransactionFiltersProps {
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  type: TransactionType | "";
  onTypeChange: (type: TransactionType | "") => void;
  walletId: string;
  onWalletChange: (walletId: string) => void;
  wallets: Wallet[];
}

export default function TransactionFilters({
  preset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  type,
  onTypeChange,
  walletId,
  onWalletChange,
  wallets,
}: TransactionFiltersProps) {
  const { t: tr } = useLanguage();

  const presetOptions: { key: DatePreset; label: string }[] = [
    { key: "today", label: tr.transactions.filterToday },
    { key: "yesterday", label: tr.transactions.filterYesterday },
    { key: "thisWeek", label: tr.transactions.filterThisWeek },
    { key: "thisMonth", label: tr.transactions.filterThisMonth },
    { key: "custom", label: tr.transactions.filterCustom },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {presetOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onPresetChange(opt.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              preset === opt.key ? "bg-brand-600 text-white" : "bg-white text-slate-500 shadow-card"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap items-center gap-2 rounded-card bg-white p-3 shadow-card">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            className="rounded-lg border border-brand-50 px-2 py-1 text-sm text-brand-900"
          />
          <span className="text-sm text-slate-400">{tr.transactions.filterTo}</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="rounded-lg border border-brand-50 px-2 py-1 text-sm text-brand-900"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as TransactionType | "")}
          className="rounded-lg border border-brand-50 bg-white px-2 py-1.5 text-xs font-semibold text-brand-900 shadow-card"
        >
          <option value="">{tr.transactions.filterAllTypes}</option>
          <option value="income">{tr.transactions.income}</option>
          <option value="expense">{tr.transactions.expense}</option>
          <option value="transfer">{tr.transactions.transfer}</option>
        </select>

        <select
          value={walletId}
          onChange={(e) => onWalletChange(e.target.value)}
          className="rounded-lg border border-brand-50 bg-white px-2 py-1.5 text-xs font-semibold text-brand-900 shadow-card"
        >
          <option value="">{tr.transactions.filterAllWallets}</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
