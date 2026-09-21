"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { gap, radius, text } from "@/lib/design-tokens";

interface DashboardStats {
  skillsCount: number;
  projectsCount: number;
  photographyCount: number;
  blogCount: number;
  socialCount: number;
  musicCount: number;
}

const STAT_CONFIG = [
  {
    key: "skillsCount" as const,
    labelKey: "admin.dashboard.stats.skills",
    defaultLabel: "Skills",
    icon: "skills",
    href: "/admin/skills",
    accent: "violet",
  },
  {
    key: "projectsCount" as const,
    labelKey: "admin.dashboard.stats.projects",
    defaultLabel: "Projects",
    icon: "projects",
    href: "/admin/projects",
    accent: "cyan",
  },
  {
    key: "photographyCount" as const,
    labelKey: "admin.dashboard.stats.photography",
    defaultLabel: "Photography",
    icon: "camera",
    href: "/admin/photography",
    accent: "indigo",
  },
  {
    key: "musicCount" as const,
    labelKey: "admin.dashboard.stats.music",
    defaultLabel: "Music Tracks",
    icon: "music",
    href: "/admin/music",
    accent: "pink",
  },
  {
    key: "blogCount" as const,
    labelKey: "admin.dashboard.stats.blog",
    defaultLabel: "Blog Posts",
    icon: "blog",
    href: "/admin/blog",
    accent: "emerald",
  },
  {
    key: "socialCount" as const,
    labelKey: "admin.dashboard.stats.social",
    defaultLabel: "Social Links",
    icon: "links",
    href: "/admin/social-links",
    accent: "violet",
  },
];

const ACCENT_CLASSES: Record<string, string> = {
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [skillsRes, projectsRes, photoRes, blogRes, socialRes, musicRes] = await Promise.all([
          fetch("/api/admin/skills"),
          fetch("/api/admin/projects"),
          fetch("/api/admin/photography"),
          fetch("/api/admin/blog"),
          fetch("/api/admin/social-links"),
          fetch("/api/music/tracks"),
        ]);

        if (skillsRes.status === 401) {
          router.push("/admin/login");
          return;
        }

        const [skills, projects, photos, blog, social, music] = await Promise.all([
          skillsRes.json(),
          projectsRes.json(),
          photoRes.json(),
          blogRes.json(),
          socialRes.json(),
          musicRes.json(),
        ]);

        setStats({
          skillsCount: Array.isArray(skills) ? skills.length : 0,
          projectsCount: Array.isArray(projects) ? projects.length : 0,
          photographyCount: Array.isArray(photos) ? photos.length : 0,
          blogCount: Array.isArray(blog) ? blog.length : 0,
          socialCount: Array.isArray(social) ? social.length : 0,
          musicCount: Array.isArray(music) ? music.length : 0,
        });
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [router]);

  const quickActions = [
    {
      icon: "camera",
      label: t("admin.sidebar.photography"),
      description: t("admin.dashboard.descriptions.photo"),
      actions: [
        { label: t("admin.dashboard.actions.managePhotos"), href: "/admin/photography", primary: true },
        { label: t("admin.dashboard.actions.viewGallery"), href: "/photography", primary: false },
      ],
    },
    {
      icon: "music",
      label: t("admin.sidebar.music"),
      description: t("admin.dashboard.descriptions.music"),
      actions: [
        { label: t("admin.dashboard.actions.addTrack"), href: "/admin/music/new", primary: true },
        { label: t("admin.dashboard.actions.manage"), href: "/admin/music", primary: false },
      ],
    },
    {
      icon: "settings",
      label: t("admin.sidebar.siteConfig"),
      description: t("admin.dashboard.descriptions.siteConfig"),
      actions: [{ label: t("admin.dashboard.actions.editConfig"), href: "/admin/site-config", primary: true }],
    },
    {
      icon: "blog",
      label: t("admin.sidebar.blog"),
      description: t("admin.dashboard.descriptions.blog"),
      actions: [
        { label: t("admin.dashboard.actions.newPost"), href: "/admin/blog/new", primary: true },
        { label: t("admin.dashboard.actions.allPosts"), href: "/admin/blog", primary: false },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <AdminHeader
        title={t("admin.dashboard.title")}
        description={t("admin.dashboard.description")}
        icon="dashboard"
      />

      {/* ── Stat Cards ── */}
      <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6", gap.base)}>
        {STAT_CONFIG.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className={cn("group p-4", radius.card, "bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-150")}
          >
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-3 ${ACCENT_CLASSES[card.accent]}`}>
              <Icon name={card.icon} size={15} />
            </div>
            <p className={cn("text-2xl font-bold", text.primaryDark, "tabular-nums")}>
              {loading ? (
                <span className="inline-block w-8 h-6 bg-white/8 rounded animate-pulse" />
              ) : (
                stats?.[card.key] ?? 0
              )}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {t(card.labelKey)}
            </p>
          </Link>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">
          {t("admin.dashboard.quickActions")}
        </h2>
        <div className={cn("grid grid-cols-1 md:grid-cols-3", gap.loose)}>
          {quickActions.map((section) => (
            <div
              key={section.label}
              className={cn("p-5", radius.card, "bg-white/[0.02] border border-white/[0.07] flex flex-col justify-between", gap.loose)}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <Icon name={section.icon} size={16} className="text-slate-500" />
                  <h3 className={cn("text-sm font-semibold", text.primaryDark)}>{section.label}</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{section.description}</p>
              </div>

              <div className={cn("flex", gap.tight)}>
                {section.actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={
                      action.primary
                        ? "px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
                        : "px-3 py-1.5 rounded-lg bg-white/6 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors border border-white/8"
                    }
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tech Stack Reference ── */}
      <div>
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">
          {t("admin.dashboard.techStack")}
        </h2>
        <div className={cn("p-5", radius.card, "bg-white/[0.02] border border-white/[0.07]")}>
          <div className={cn("flex flex-wrap", gap.base, "items-center")}>
            {[
              { name: "nextjs", label: "Next.js 14" },
              { name: "react", label: "React 18" },
              { name: "typescript", label: "TypeScript" },
              { name: "tailwind", label: "Tailwind CSS" },
              { name: "prisma", label: "Prisma ORM" },
              { name: "postgresql", label: "PostgreSQL" },
              { name: "cloudinary", label: "Cloudinary" },
              { name: "threejs", label: "Three.js" },
            ].map((tech) => (
              <div
                key={tech.name}
                className={cn("flex items-center gap-1.5 px-2.5 py-1.5", radius.chip, "bg-white/[0.04] border border-white/[0.07]")}
              >
                <Icon name={tech.name} size={14} />
                <span className="text-xs text-slate-400 font-medium">{tech.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
