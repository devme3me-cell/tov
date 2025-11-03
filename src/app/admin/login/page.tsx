"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "帳號或密碼錯誤");
        setLoading(false);
        return;
      }

      // Success - redirect to admin page
      router.push("/admin");
    } catch (err) {
      setError("登入失敗，請稍後再試");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen text-white relative">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1000px_600px_at_20%_0%,rgba(239,68,68,0.15),transparent),radial-gradient(800px_600px_at_80%_100%,rgba(239,68,68,0.2),transparent)]" />
      <div className="mx-auto max-w-md px-4 pt-16">
        <h1 className="text-2xl font-bold mb-4">管理員登入</h1>
        <form onSubmit={handleLogin} className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-md">
          <div>
            <label className="text-sm text-white/80" htmlFor="admin-username">
              帳號
            </label>
            <input
              id="admin-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none placeholder:text-white/40 focus:border-red-400/60"
              placeholder="輸入帳號"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-sm text-white/80" htmlFor="admin-password">
              密碼
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none placeholder:text-white/40 focus:border-red-400/60"
              placeholder="輸入密碼"
              disabled={loading}
            />
          </div>
          {error && <div className="text-red-300 text-sm">{error}</div>}
          <button
            className="w-full rounded-2xl bg-red-500/80 hover:bg-red-500/90 px-5 py-3 font-medium shadow-lg shadow-red-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? "登入中..." : "登入"}
          </button>
        </form>
      </div>
    </main>
  );
}
