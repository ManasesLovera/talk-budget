"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  clearToken,
  createCategory,
  deleteCategory,
  getCategories,
  updateMe,
  type Category,
} from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#12876a");
  const [catError, setCatError] = useState<string | null>(null);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    setProfileError(null);
    try {
      await updateMe({
        username,
        email,
        ...(password ? { password } : {}),
      });
      await refreshUser();
      setPassword("");
      setProfileMsg("Profile updated.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!catName.trim()) return;
    setCatError(null);
    try {
      const created = await createCategory({ name: catName.trim(), color: catColor });
      setCategories((prev) => [...prev, created]);
      setCatName("");
    } catch (err) {
      setCatError(err instanceof Error ? err.message : "Failed to create category");
    }
  }

  async function handleDeleteCategory(id: number) {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <div className="px-4 py-4 md:mx-auto md:max-w-5xl md:px-8 md:py-6">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm font-semibold text-brand-600 md:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="md:grid md:grid-cols-2 md:items-start md:gap-6">
      {/* Profile */}
      <section className="mb-6 rounded-card bg-white p-4 shadow-card md:mb-0">
        <h2 className="mb-3 font-bold text-brand-900">Profile</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              New password (optional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm outline-none"
            />
          </div>
          {profileMsg && <p className="text-xs font-medium text-brand-600">{profileMsg}</p>}
          {profileError && (
            <p className="text-xs font-medium text-rose-500">{profileError}</p>
          )}
          <button
            type="submit"
            disabled={profileSaving}
            className="bg-brand-gradient w-full rounded-xl py-2.5 font-bold text-white disabled:opacity-60"
          >
            {profileSaving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      {/* Categories */}
      <section className="mb-6 rounded-card bg-white p-4 shadow-card md:mb-0">
        <h2 className="mb-3 font-bold text-brand-900">Categories</h2>

        <div className="mb-3 space-y-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-sm font-medium text-brand-900">{c.name}</span>
                {c.owner_id === null && (
                  <span className="text-[10px] uppercase text-slate-400">default</span>
                )}
              </div>
              {c.owner_id !== null && (
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  aria-label="Delete category"
                  className="text-slate-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleAddCategory} className="flex items-center gap-2">
          <input
            type="color"
            value={catColor}
            onChange={(e) => setCatColor(e.target.value)}
            className="h-9 w-9 rounded-lg border border-brand-100"
          />
          <input
            type="text"
            placeholder="New category name"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            className="flex-1 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            className="bg-brand-gradient flex h-9 w-9 items-center justify-center rounded-full text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
        {catError && <p className="mt-2 text-xs font-medium text-rose-500">{catError}</p>}
      </section>
      </div>

      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-card bg-white py-3 font-bold text-rose-500 shadow-card md:mx-auto md:mt-6 md:max-w-xl"
      >
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </div>
  );
}
