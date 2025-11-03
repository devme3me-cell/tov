"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

type Submission = {
  id: string;
  date: string;
  username: string;
  plan: number;
  total: number;
  photos: string[];
  createdAt: string;
  status?: string;
  note?: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<Submission[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function fetchSubmissions() {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Admin fetch error:", err);
      setError("載入資料失敗");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string, note?: string) {
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Redirect to login if unauthorized
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to update");
      }

      // Refresh data
      await fetchSubmissions();
    } catch (err) {
      setError("更新狀態失敗");
      console.error(err);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return (
    <main className="min-h-screen text-white relative">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1000px_600px_at_20%_0%,rgba(239,68,68,0.15),transparent),radial-gradient(800px_600px_at_80%_100%,rgba(239,68,68,0.2),transparent)]" />
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">申請資料總覽</h1>
            <p className="text-white/70">顯示所有後端儲存的申請資料與照片預覽。</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2 text-sm transition"
          >
            登出
          </button>
        </header>

        {loading && <div>載入中...</div>}
        {error && <div className="text-red-300 text-sm">{error}</div>}
        {!loading && !error && data && data.length === 0 && (
          <div className="text-white/70">目前尚無資料</div>
        )}
        {!loading && !error && data && data.length > 0 && (
          <div className="space-y-6">
            {data.map((d) => (
              <div key={d.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap gap-4 items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-semibold">帳號：{d.username}</div>
                    <div className="text-white/70 text-sm">
                      申請日期：{d.date}｜方案最低流水：{d.plan.toLocaleString("zh-TW")}｜總流水：{d.total.toLocaleString("zh-TW")}
                    </div>
                    <div className="text-white/40 text-xs">建立時間：{new Date(d.createdAt).toLocaleString("zh-TW")}</div>
                    {d.status && (
                      <div className="mt-1 text-sm">
                        <span className="text-white/60">狀態：</span>
                        <span
                          className={
                            d.status === "approved"
                              ? "text-green-400"
                              : d.status === "rejected"
                                ? "text-red-400"
                                : "text-yellow-400"
                          }
                        >
                          {d.status === "approved" ? "已批准" : d.status === "rejected" ? "已拒絕" : "待審核"}
                        </span>
                      </div>
                    )}
                    {d.note && <div className="text-white/60 text-xs mt-1">備註：{d.note}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(d.id, "approved")}
                      className="rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 px-3 py-1.5 text-sm transition"
                    >
                      批准
                    </button>
                    <button
                      onClick={() => {
                        const note = prompt("拒絕原因（選填）：");
                        updateStatus(d.id, "rejected", note || undefined);
                      }}
                      className="rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-3 py-1.5 text-sm transition"
                    >
                      拒絕
                    </button>
                    <button
                      onClick={() => updateStatus(d.id, "pending")}
                      className="rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 px-3 py-1.5 text-sm transition"
                    >
                      待審核
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {d.photos.map((url, idx) => (
                    <button
                      key={url + idx}
                      type="button"
                      onClick={() => setLightboxUrl(url)}
                      className="block group"
                    >
                      <img
                        src={url}
                        alt="預覽"
                        className="h-24 w-full object-cover rounded-xl border border-white/10 group-hover:border-red-400/60 transition cursor-zoom-in"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-[85vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="關閉"
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 p-2 text-white shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxUrl}
              alt="預覽"
              className="max-w-[90vw] max-h-[80vh] rounded-xl border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}
