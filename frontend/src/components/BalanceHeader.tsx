"use client";

interface BalanceHeaderProps {
  title: string;
  amount: number;
  spent: number;
  total: number;
}

export default function BalanceHeader({
  title,
  amount,
  spent,
  total,
}: BalanceHeaderProps) {
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;

  return (
    <div className="bg-brand-gradient rounded-b-card px-5 pb-8 pt-6 text-white shadow-card">
      <p className="text-sm font-medium text-white/85">{title}</p>

      {/* Balance */}
      <div className="mt-3 flex items-center gap-3">
        <span className="text-5xl font-extrabold tracking-tight">
          ${amount.toLocaleString()}
        </span>
        <span className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold">
          Left
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-5">
        <div className="relative h-2.5 w-full rounded-full bg-white/25">
          <div
            className="absolute left-0 top-0 h-2.5 rounded-full bg-brand-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-white/90">
          <span className="font-semibold">${spent.toLocaleString()}</span> of $
          {total.toLocaleString()} spent
        </p>
      </div>
    </div>
  );
}
