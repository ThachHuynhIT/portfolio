"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { elevation, radius, text } from "@/lib/design-tokens";

async function hashPassword(password: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const passwordHash = await hashPassword(password);
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordHash }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("admin.login.authFailed", "Authentication failed"));
      }

      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.08)_0%,_transparent_60%)] pointer-events-none" />

      {/* Language Switcher in top right */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher variant="pill" size="sm" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className={cn("bg-slate-900/80 border border-white/[0.08]", radius.card, "p-8 shadow-2xl shadow-black/50", elevation.blurStrong)}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className={cn("w-12 h-12 mb-4", radius.control, "bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold", text.primaryDark, "text-lg shadow-lg shadow-violet-500/30")}>
              A
            </div>
            <h1 className={cn("text-lg font-bold", text.primaryDark)}>{t("admin.login.title", "Portfolio Admin")}</h1>
            <p className="text-slate-500 text-sm mt-1">{t("admin.login.subtitle", "Sign in to manage your content")}</p>
          </div>

          {error && (
            <div className={cn("mb-5 px-4 py-3", radius.control, "bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center")}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider"
              >
                {t("admin.login.passwordLabel", "Password")}
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("admin.login.passwordPlaceholder", "••••••••")}
                required
                autoFocus
                className={cn("w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.1]", radius.control, text.primaryDark, "text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40 transition-all")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn("w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50", text.primaryDark, "font-semibold text-sm", radius.control, "shadow-md shadow-violet-500/20 transition-colors disabled:cursor-not-allowed")}
            >
              {loading ? t("admin.login.submitting", "Signing in…") : t("admin.login.submitBtn", "Sign In")}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-700 text-xs mt-5">
          Portfolio Content Management System
        </p>
      </div>
    </div>
  );
}
