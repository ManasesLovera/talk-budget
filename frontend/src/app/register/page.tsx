"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Mail, User as UserIcon, Wallet } from "lucide-react";
import { login, register, setToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ username, email, password });
      const res = await login(username, password);
      setToken(res.access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-brand-gradient flex flex-col items-center rounded-b-card px-6 pb-12 pt-20 text-white shadow-card">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
          <Wallet className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold">Talk Budget</h1>
        <p className="mt-1 text-sm text-white/80">Create your account</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-5 -mt-6 rounded-card bg-white p-6 shadow-card"
      >
        <label className="mb-1 block text-sm font-semibold text-brand-900">
          Username
        </label>
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5">
          <UserIcon className="h-4 w-4 text-brand-500" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            placeholder="John Smith"
          />
        </div>

        <label className="mb-1 block text-sm font-semibold text-brand-900">
          Email
        </label>
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5">
          <Mail className="h-4 w-4 text-brand-500" />
          <input
            type="email"
            className="w-full bg-transparent text-sm outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoCapitalize="none"
            placeholder="john.smith@example.com"
          />
        </div>

        <label className="mb-1 block text-sm font-semibold text-brand-900">
          Password
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
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-500">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
