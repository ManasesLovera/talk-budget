"use client";

interface AccountCardProps {
  label: string;
  amount: number;
}

export default function AccountCard({ label, amount }: AccountCardProps) {
  const negative = amount < 0;
  return (
    <div className="flex items-center justify-between rounded-card bg-white px-5 py-4 shadow-card">
      <span className="text-lg font-bold text-brand-700">{label}</span>
      <span
        className={`text-lg font-bold ${
          negative ? "text-rose-500" : "text-brand-900"
        }`}
      >
        {negative ? "-" : ""}${Math.abs(amount).toLocaleString()}
      </span>
    </div>
  );
}
