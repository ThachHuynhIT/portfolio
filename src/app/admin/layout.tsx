"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Icon from "@/components/ui/Icon";
import { ToastProvider } from "@/context/ToastContext";

// Maps pathname prefixes to breadcrumb labels + icons
const BREADCRUMBS: Record<string, { label: string; icon: string }> = {
  "/admin/skills": { label: "Skills", icon: "skills" },
  "/admin/projects": { label: "Projects", icon: "projects" },
  "/admin/photography": { label: "Photography", icon: "camera" },
  "/admin/music": { label: "Music Tracks", icon: "music" },
  "/admin/blog": { label: "Blog Posts", icon: "blog" },
  "/admin/couple": { label: "Couple & Kỷ niệm", icon: "heart" },
  "/admin/media": { label: "Media Library", icon: "image" },
  "/admin/site-config": { label: "Site Config", icon: "settings" },
  "/admin/social-links": { label: "Social Links", icon: "links" },
  "/admin/nav-links": { label: "Nav Links", icon: "nav" },
  "/admin/login": { label: "Login", icon: "dashboard" },
};

function getCurrentCrumb(pathname: string) {
  if (pathname === "/admin") return { label: "Dashboard", icon: "dashboard" };
  const match = Object.entries(BREADCRUMBS).find(([key]) =>
    pathname.startsWith(key)
  );
  return match ? match[1] : { label: "Admin", icon: "dashboard" };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-950 text-white">{children}</div>;
  }

  const crumb = getCurrentCrumb(pathname);

  return (
    <ToastProvider>
      <div className="h-screen w-screen overflow-hidden bg-slate-950 text-white flex">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* ── Top breadcrumb bar ── */}
          <header className="h-14 border-b border-white/5 bg-slate-950/80 backdrop-blur-md flex items-center px-6 gap-3 flex-shrink-0 z-10">
            <Link
              href="/admin"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
            >
              Admin
            </Link>
            {pathname !== "/admin" && (
              <>
                <span className="text-slate-700 text-xs">/</span>
                <div className="flex items-center gap-1.5">
                  <Icon name={crumb.icon} size={13} className="text-slate-500" />
                  <span className="text-xs font-semibold text-slate-300">{crumb.label}</span>
                </div>
              </>
            )}
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
