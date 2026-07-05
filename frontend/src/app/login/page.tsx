"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, User as UserIcon, Wallet } from "lucide-react";
import { login, setToken } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/language-context";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(username, password);
      setToken(res.access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.login.loginFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:min-h-screen md:items-center md:justify-center md:bg-mint-bg">
      <div className="flex flex-col md:mx-auto md:w-full md:max-w-sm md:overflow-hidden md:rounded-card md:shadow-card">
      <div className="bg-brand-gradient flex flex-col items-center rounded-b-card px-6 pb-12 pt-20 text-white shadow-card md:rounded-none md:pt-12 md:shadow-none">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
          <Wallet className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold">{t.nav.appName}</h1>
        <p className="mt-1 text-sm text-white/80">
          {t.login.subtitle}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-5 -mt-6 rounded-card bg-white p-6 shadow-card md:mx-0 md:mt-0 md:rounded-none md:shadow-none"
      >
        <label className="mb-1 block text-sm font-semibold text-brand-900">
          {t.login.username}
        </label>
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5">
          <UserIcon className="h-4 w-4 text-brand-500" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            placeholder={t.login.usernamePlaceholder}
          />
        </div>

        <label className="mb-1 block text-sm font-semibold text-brand-900">
          {t.login.password}
        </label>
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5">
          <Lock className="h-4 w-4 text-brand-500" />
          <input
            type="password"
            className="w-full bg-transparent text-sm outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="mb-3 text-sm font-medium text-rose-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-gradient py-3 font-bold text-white shadow-card transition active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? t.login.signingIn : t.login.signIn}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          {t.login.noAccount}{" "}
          <Link href="/register" className="font-semibold text-brand-500">
            {t.login.createOne}
          </Link>
        </p>
      </form>
      </div>
    </div>
  );
}
