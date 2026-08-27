"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Icon from "@/components/ui/Icon";

const CONTENT_ITEMS = [
  { label: "Skills", href: "/admin/skills", icon: "skills" },
  { label: "Projects", href: "/admin/projects", icon: "projects" },
  { label: "Music Tracks", href: "/admin/music", icon: "music" },
  { label: "Blog Posts", href: "/admin/blog", icon: "blog" },
];

const SYSTEM_ITEMS = [
  { label: "Site Config", href: "/admin/site-config", icon: "settings" },
  { label: "Social Links", href: "/admin/social-links", icon: "links" },
  { label: "Nav Links", href: "/admin/nav-links", icon: "nav" },
];

function NavItem({
  item,
  isActive,
  collapsed,
}: {
  item: { label: string; href: string; icon: string };
  isActive: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
        isActive
          ? "bg-violet-500/12 text-violet-300 border border-violet-500/20"
          : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
      )}
    >
      {/* Active left border indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400 rounded-full -ml-px" />
      )}

      <Icon
        name={item.icon}
        size={17}
        className={isActive ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"}
      />

      {!collapsed && (
        <span className="leading-none">{item.label}</span>
      )}
    </Link>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin_sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem("admin_sidebar_collapsed", String(!prev));
      return !prev;
    });
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen max-h-screen sticky top-0 border-r border-white/5 bg-slate-950 transition-all duration-200 ease-in-out flex-shrink-0 z-20 select-none",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* ── Logo / Brand ── */}
      <div
        className={cn(
          "flex items-center h-14 border-b border-white/5 px-3 flex-shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              A
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white leading-none">Admin CMS</p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5 truncate">Portfolio</p>
            </div>
          </Link>
        )}

        {collapsed && (
          <Link href="/admin">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
          </Link>
        )}

        {/* Collapse toggle — only show on expanded */}
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            title="Collapse sidebar"
          >
            <Icon name="chevronLeft" size={14} />
          </button>
        )}
      </div>

      {/* ── Dashboard ── */}
      <div className="px-2.5 pt-3 flex-shrink-0">
        <Link
          href="/admin"
          title={collapsed ? "Dashboard" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
            isActive("/admin")
              ? "bg-violet-500/12 text-violet-300 border border-violet-500/20"
              : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
          )}
        >
          {isActive("/admin") && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400 rounded-full -ml-px" />
          )}
          <Icon
            name="dashboard"
            size={17}
            className={isActive("/admin") ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"}
          />
          {!collapsed && <span className="leading-none">Dashboard</span>}
        </Link>
      </div>

      {/* ── Navigation items ── */}
      <nav className="flex-1 min-h-0 px-2.5 pt-4 space-y-5 overflow-y-auto">
        {/* Content section */}
        <div className="space-y-0.5">
          {!collapsed && (
            <p className="px-3 pb-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              Content
            </p>
          )}
          {CONTENT_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* System section */}
        <div className="space-y-0.5">
          {!collapsed && (
            <p className="px-3 pb-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              System
            </p>
          )}
          {SYSTEM_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="px-2.5 pb-3 pt-2 border-t border-white/5 space-y-0.5 flex-shrink-0">
        {/* Expand toggle when collapsed */}
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            title="Expand sidebar"
          >
            <Icon name="chevronRight" size={15} />
          </button>
        )}

        <Link
          href="/"
          target="_blank"
          title={collapsed ? "View Site" : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all group"
        >
          <Icon name="globe" size={17} className="text-slate-500 group-hover:text-slate-300" />
          {!collapsed && <span>View Site</span>}
        </Link>

        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/70 hover:text-red-300 hover:bg-red-500/8 transition-all group"
        >
          <Icon name="logout" size={17} className="text-red-400/50 group-hover:text-red-300" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
