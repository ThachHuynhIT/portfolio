"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Icon from "@/components/ui/Icon";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { ToastProvider } from "@/context/ToastContext";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { elevation, gap, radius, surface, text } from "@/lib/design-tokens";

// Maps pathname prefixes to translation keys + default labels + icons
const BREADCRUMBS: Record<string, { key: string; defaultLabel: string; icon: string }> = {
  "/admin/skills": { key: "admin.sidebar.skills", defaultLabel: "Skills", icon: "skills" },
  "/admin/projects": { key: "admin.sidebar.projects", defaultLabel: "Projects", icon: "projects" },
  "/admin/photography": { key: "admin.sidebar.photography", defaultLabel: "Photography", icon: "camera" },
  "/admin/music": { key: "admin.sidebar.music", defaultLabel: "Music Tracks", icon: "music" },
  "/admin/blog": { key: "admin.sidebar.blog", defaultLabel: "Blog Posts", icon: "blog" },
  "/admin/couple": { key: "admin.sidebar.couple", defaultLabel: "Couple & Memories", icon: "heart" },
  "/admin/media": { key: "admin.sidebar.media", defaultLabel: "Media Library", icon: "image" },
  "/admin/site-config": { key: "admin.sidebar.siteConfig", defaultLabel: "Site Config", icon: "settings" },
  "/admin/social-links": { key: "admin.sidebar.socialLinks", defaultLabel: "Social Links", icon: "links" },
  "/admin/nav-links": { key: "admin.sidebar.navLinks", defaultLabel: "Nav Links", icon: "nav" },
  "/admin/login": { key: "admin.common.admin", defaultLabel: "Login", icon: "dashboard" },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <div className={cn("min-h-screen bg-slate-950", text.primaryDark)}>{children}</div>;
  }

  const match = Object.entries(BREADCRUMBS).find(([prefix]) =>
    pathname.startsWith(prefix)
  );

  const currentCrumb = match
    ? { label: t(match[1].key), icon: match[1].icon }
    : pathname === "/admin"
    ? { label: t("admin.sidebar.dashboard"), icon: "dashboard" }
    : { label: t("admin.common.admin"), icon: "dashboard" };

  return (
    <ToastProvider>
      <div className={cn("h-screen w-screen overflow-hidden bg-slate-950", text.primaryDark, "flex")}>
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* ── Top bar: Breadcrumb & Language Switcher ── */}
          <header className={cn("h-14 border-b border-white/5 bg-slate-950/80", elevation.blur, "flex items-center justify-between px-6", gap.base, "flex-shrink-0 z-10")}>
            {/* Left: Breadcrumbs */}
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                href="/admin"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
              >
                {t("admin.common.admin", "Admin")}
              </Link>
              {pathname !== "/admin" && (
                <>
                  <span className="text-slate-700 text-xs">/</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon name={currentCrumb.icon} size={13} className="text-slate-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-300 truncate">
                      {currentCrumb.label}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Right: Quick Switcher (Flags) & View Site link */}
            <div className={cn("flex items-center", gap.base, "flex-shrink-0")}>
              {/* Flag-based Language Switcher */}
              <div className={cn("flex items-center", gap.tight)}>
                <LanguageSwitcher variant="pill" size="sm" />
              </div>

              <div className={cn("h-4 w-px", surface.raisedDark)} />

              <Link
                href="/"
                target="_blank"
                title={t("admin.sidebar.viewSite", "View Site")}
                className={cn("p-1.5", radius.chip, "text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 flex items-center gap-1.5 text-xs font-medium")}
              >
                <Icon name="globe" size={14} className="text-slate-400" />
                <span className="hidden sm:inline text-xs text-slate-400 hover:text-slate-200">
                  {t("admin.sidebar.viewSite", "View Site")}
                </span>
              </Link>
            </div>
          </header>

          {/* ── Page content ── */}
          <main className="flex-1 p-7 overflow-y-auto min-h-0">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
