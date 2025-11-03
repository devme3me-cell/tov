"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Plan = 10000 | 30000 | 70000;

function formatDateChinese(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}年${m}月${day}日`;
}

function getYesterday(base: Date) {
  const d = new Date(base);
  d.setDate(d.getDate() - 1);
  return d;
}

function getTomorrow(base: Date) {
  const d = new Date(base);
  d.setDate(d.getDate() + 1);
  return d;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ParticlesBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const particles = Array.from({ length: Math.max(80, Math.floor((w * h) / 30000)) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 1 + Math.random() * 2.2,
    }));

    const bgGradient = ctx.createLinearGradient(0, 0, w, h);
    bgGradient.addColorStop(0, "#080808");
    bgGradient.addColorStop(1, "#120000");

    let raf = 0;
    const draw = () => {
      // Background
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, w, h);

      // Subtle radial vignette
      const rg = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, Math.max(w, h) * 0.8);
      rg.addColorStop(0, "rgba(255,0,0,0.08)");
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);

      // Particles
      ctx.globalCompositeOperation = "lighter";
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -50) p.x = w + 50;
        if (p.x > w + 50) p.x = -50;
        if (p.y < -50) p.y = h + 50;
        if (p.y > h + 50) p.y = -50;

        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
        grd.addColorStop(0, "rgba(255, 80, 80, 0.9)");
        grd.addColorStop(0.5, "rgba(255, 0, 0, 0.35)");
        grd.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr2 = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr2;
      canvas.height = h * dpr2;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr2, dpr2);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 -z-10" />;
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-red-500",
        "border-t-transparent",
        className,
      )}
    />
  );
}

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [totalTurnover, setTotalTurnover] = useState("");
  const [photos, setPhotos] = useState<Array<{ url: string; file: File }>>([]);
  const [now, setNow] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize date on client-side only to avoid hydration mismatch
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const yesterdayStr = useMemo(() => now ? formatDateChinese(getYesterday(now)) : "", [now]);
  const tomorrowStr = useMemo(() => now ? formatDateChinese(getTomorrow(now)) : "", [now]);

  const todayKey = useMemo(() => {
    if (!now) return "";
    const d = new Date(now);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, [now]);

  const todayRecord = useMemo(() => {
    try {
      const raw = localStorage.getItem(`record-${todayKey}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [todayKey, step]);

  function confirmAccount() {
    setError(null);
    if (!username.trim()) {
      setError("請輸入帳號");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 800);
  }

  function goToStep(s: 1 | 2 | 3 | 4) {
    setStep(s);
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...next].slice(0, 12));
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submitApplication() {
    setError(null);
    const min = selectedPlan ?? 0;
    const total = Number(totalTurnover.replace(/[^0-9]/g, ""));
    if (!selectedPlan) {
      setError("請先選擇申請方案");
      return;
    }
    if (photos.length === 0) {
      setError("請上傳至少一張流水照片");
      return;
    }
    if (!total || Number.isNaN(total) || total < min) {
      setError(`總流水需達到至少 ${min.toLocaleString("zh-TW")} 元`);
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      try {
        const fd = new FormData();
        fd.append("username", username);
        fd.append("plan", String(selectedPlan));
        fd.append("total", String(total));
        for (const p of photos) {
          fd.append("files", p.file, p.file.name || "upload.jpg");
        }
        const res = await fetch("/api/submissions", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "提交失敗" }));
          setError(err.error || "提交失敗");
          setLoading(false);
          return;
        }
        const entry = await res.json();
        try {
          localStorage.setItem(`record-${todayKey}`, JSON.stringify(entry));
        } catch {}
      } catch (e) {
        setError("提交失敗，請稍後再試");
        setLoading(false);
        return;
      }
      setLoading(false);
      setStep(4);
    }, 600);
  }

  // UI helpers
  const StepIndicator = () => (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-4 py-3 border backdrop-blur-md",
            "bg-white/5 border-white/10 text-white/70",
            n <= step && "bg-red-500/15 border-red-500/30 text-white",
          )}
        >
          <div
            className={cn(
              "h-8 w-8 shrink-0 grid place-items-center rounded-xl border",
              "border-white/20",
              n <= step ? "bg-red-500/80 border-red-300/50" : "bg-white/10",
            )}
          >
            <span className="font-semibold text-sm">{n}</span>
          </div>
          <div className="text-sm">
            {n === 1 && "帳號確認"}
            {n === 2 && "選擇方案"}
            {n === 3 && "上傳流水"}
            {n === 4 && "完成申請"}
          </div>
        </div>
      ))}
    </div>
  );

  const OptionCard = ({ value, title, subtitle }: { value: Plan; title: string; subtitle: string }) => (
    <button
      type="button"
      onClick={() => setSelectedPlan(value)}
      className={cn(
        "text-left rounded-2xl p-4 border hover:border-red-400/60 transition-colors",
        "bg-white/5 border-white/10 text-white/80 backdrop-blur-md",
        selectedPlan === value && "ring-2 ring-red-400/60 border-red-500/60",
      )}
    >
      <div className="font-semibold text-base">{title}</div>
      <div className="text-xs text-white/60 mt-1">{subtitle}</div>
    </button>
  );

  const UploadArea = () => (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => document.getElementById("photoInput")?.click()}
      className="cursor-pointer rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-white/70 hover:bg-white/10 transition-colors backdrop-blur-md"
    >
      <div className="text-3xl mb-1">🖼️</div>
      <div>點擊或拖拽上傳照片</div>
      <div className="text-xs text-white/50 mt-1">支援 JPG, PNG 格式，可上傳多張</div>
    </div>
  );

  return (
    <main className="min-h-screen text-white relative">
      <ParticlesBackground />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1000px_600px_at_20%_0%,rgba(239,68,68,0.15),transparent),radial-gradient(800px_600px_at_80%_100%,rgba(239,68,68,0.2),transparent)]" />

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-10">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-1.5 text-sm tracking-wide">
            馬來迎富
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold">馬來迎富每日流水簽到</h1>
          <p className="mt-2 text-white/70">申請昨日流水彩金，隔日發放</p>
        </header>

        <div className="rounded-3xl border border-white/10 bg-black/30 p-5 sm:p-6 backdrop-blur-md shadow-xl shadow-red-950/20">
          <StepIndicator />

          {loading && (
            <div className="text-center py-6">
              <Spinner className="mx-auto" />
              <div className="mt-2 text-white/80">處理中...</div>
            </div>
          )}

          {!loading && step === 1 && (
            <section className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-semibold mb-1">現在時間</div>
                <div className="text-lg" id="currentDateTime">{now ? `${formatDateChinese(now)} ${now.toLocaleTimeString("zh-TW", { hour12: false })}` : "載入中..."}</div>
                <div className="text-sm text-white/70 mt-1" id="applicationDateNotice">
                  現在申請的是 {yesterdayStr} 的流水紀錄
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/80 lg:font-bold" htmlFor="username">
                  請輸入您的3A/朕天下帳號
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="輸入帳號"
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none placeholder:text-white/40 focus:border-red-400/60"
                />
              </div>
              {error && <div className="text-red-300 text-sm">{error}</div>}
              <div className="flex justify-end">
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-500/80 hover:bg-red-500/90 px-5 py-3 font-medium shadow-lg shadow-red-900/30 transition"
                  onClick={confirmAccount}
                >
                  確認帳號
                </button>
              </div>
            </section>
          )}

          {!loading && step === 2 && (
            <section className="space-y-5">
              {todayRecord && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold mb-1">今日申請記錄</div>
                  <div className="text-sm text-white/80">
                    帳號 {todayRecord.username} 已申請方案，最低流水 {Number(todayRecord.plan).toLocaleString("zh-TW")} 元，
                    總流水 {Number(todayRecord.total).toLocaleString("zh-TW")} 元，照片 {todayRecord.photos} 張。
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-semibold mb-1">重要說明</div>
                <div className="text-sm text-white/70">
                  請上傳 <span className="text-red-400 font-semibold">{yesterdayStr}</span> 的流水照片，系統將在
                  <span className="text-red-400 font-semibold"> {tomorrowStr} </span>審核後發放彩金。如上傳其他日期的流水照片將不予處理。
                </div>
              </div>

              <div>
                <label className="text-sm text-white/80">請選擇申請方案</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3" id="optionGrid">
                  <OptionCard
                    value={10000}
                    title="流水達10,000換88"
                    subtitle="最低流水: 10,000 元 → 獲得 88 彩金"
                  />
                  <OptionCard
                    value={30000}
                    title="流水達30,000換168"
                    subtitle="最低流水: 30,000 元 → 獲得 168 彩金"
                  />
                  <OptionCard
                    value={70000}
                    title="流水達70,000換288"
                    subtitle="最低流水: 70,000 元 → 獲得 288 彩金"
                  />
                </div>
              </div>

              {error && <div className="text-red-300 text-sm">{error}</div>}
              <div className="flex justify-between">
                <button
                  className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 py-3 transition"
                  onClick={() => goToStep(1)}
                >
                  上一步
                </button>
                <button
                  className={cn(
                    "rounded-2xl px-5 py-3 transition",
                    selectedPlan
                      ? "bg-red-500/80 hover:bg-red-500/90 shadow-lg shadow-red-900/30"
                      : "bg-white/10 text-white/60 cursor-not-allowed",
                  )}
                  onClick={() => selectedPlan && goToStep(3)}
                  disabled={!selectedPlan}
                >
                  下一步
                </button>
              </div>
            </section>
          )}

          {!loading && step === 3 && (
            <section className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm text-white/80">上傳流水照片</label>
                <UploadArea />
                <input
                  id="photoInput"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3" id="photoPreview">
                    {photos.map((p, idx) => (
                      <div key={p.url} className="relative group">
                        <img src={p.url} alt="上傳預覽" className="h-20 w-full object-cover rounded-xl border border-white/10" />
                        <button
                          className="absolute top-1 right-1 hidden group-hover:inline-flex bg-black/60 hover:bg-black/80 rounded-lg px-2 py-1 text-xs"
                          onClick={() => removePhoto(idx)}
                          type="button"
                        >
                          刪除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="totalTurnover" className="text-sm text-white/80">
                  請輸入總流水金額
                </label>
                <input
                  id="totalTurnover"
                  inputMode="numeric"
                  value={totalTurnover}
                  onChange={(e) => {
                    const onlyNum = e.target.value.replace(/[^0-9]/g, "");
                    setTotalTurnover(onlyNum);
                  }}
                  placeholder="例如：50000"
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none placeholder:text-white/40 focus:border-red-400/60"
                />
              </div>

              {error && <div className="text-red-300 text-sm">{error}</div>}
              <div className="flex justify-between mt-4">
                <button
                  className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 py-3 transition"
                  onClick={() => goToStep(2)}
                >
                  上一步
                </button>
                <button
                  className={cn(
                    "rounded-2xl px-5 py-3 transition",
                    photos.length > 0 && selectedPlan
                      ? "bg-red-500/80 hover:bg-red-500/90 shadow-lg shadow-red-900/30"
                      : "bg-white/10 text-white/60 cursor-not-allowed",
                  )}
                  onClick={submitApplication}
                  disabled={!selectedPlan || photos.length === 0}
                >
                  提交申請
                </button>
              </div>
            </section>
          )}

          {!loading && step === 4 && (
            <section className="text-center py-10">
              <div className="text-2xl font-bold">申請提交成功！</div>
              <div className="mt-2 text-white/80">
                您的流水申請已成功提交，我們將在24小時內完成審核。
                審核通過後，彩金將自動發放到您的帳戶。
              </div>
              <div className="mt-8">
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-500/80 hover:bg-red-500/90 px-6 py-3 font-medium shadow-lg shadow-red-900/30 transition"
                  onClick={() => {
                    // reset form
                    photos.forEach((p) => URL.revokeObjectURL(p.url));
                    setStep(1);
                    setSelectedPlan(null);
                    setTotalTurnover("");
                    setPhotos([]);
                    setError(null);
                  }}
                >
                  返回首頁
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
