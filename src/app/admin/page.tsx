"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";

interface DashboardStats {
  skillsCount: number;
  projectsCount: number;
  blogCount: number;
  socialCount: number;
  musicCount: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [skillsRes, projectsRes, blogRes, socialRes, musicRes] = await Promise.all([
          fetch("/api/admin/skills"),
          fetch("/api/admin/projects"),
          fetch("/api/admin/blog"),
          fetch("/api/admin/social-links"),
          fetch("/api/music/tracks"),
        ]);

        if (skillsRes.status === 401) {
          router.push("/admin/login");
          return;
        }

        const [skills, projects, blog, social, music] = await Promise.all([
          skillsRes.json(),
          projectsRes.json(),
          blogRes.json(),
          socialRes.json(),
          musicRes.json(),
        ]);

        setStats({
          skillsCount: Array.isArray(skills) ? skills.length : 0,
          projectsCount: Array.isArray(projects) ? projects.length : 0,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-purple-400 animate-pulse font-medium">Loading stats...</div>
      </div>
    );
  }

  const statCards = [
    { title: "Skills", count: stats?.skillsCount ?? 0, href: "/admin/skills", icon: "💡", color: "from-blue-500/20 to-purple-500/20" },
    { title: "Projects", count: stats?.projectsCount ?? 0, href: "/admin/projects", icon: "🚀", color: "from-purple-500/20 to-pink-500/20" },
    { title: "Music Tracks", count: stats?.musicCount ?? 0, href: "/admin/music", icon: "🎵", color: "from-indigo-500/20 to-cyan-500/20" },
    { title: "Blog Posts", count: stats?.blogCount ?? 0, href: "/admin/blog", icon: "📝", color: "from-cyan-500/20 to-blue-500/20" },
    { title: "Social Links", count: stats?.socialCount ?? 0, href: "/admin/social-links", icon: "🔗", color: "from-emerald-500/20 to-teal-500/20" },
  ];

  return (
    <div>
      <AdminHeader
        title="Dashboard Overview"
        description="Welcome to your portfolio CMS. Manage site content, music lounge tracks, skills, projects, and blog posts."
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-12">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`p-5 rounded-2xl bg-gradient-to-br ${card.color} border border-white/10 hover:border-white/20 transition-all group`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-2xl font-bold text-white group-hover:scale-110 transition-transform">
                {card.count}
              </span>
            </div>
            <h2 className="text-base font-semibold text-gray-200">{card.title}</h2>
            <p className="text-xs text-gray-400 mt-1">Manage &rarr;</p>
          </Link>
        ))}
      </div>

      {/* Quick Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span>🎵</span> Music Studio
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Upload and manage audio tracks, album artwork, tags, and inspect stream counts for your /music lounge.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/music/new"
              className="inline-flex px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-purple-500/20"
            >
              Add Track
            </Link>
            <Link
              href="/admin/music"
              className="inline-flex px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-all"
            >
              Manage Tracks
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span>⚙️</span> Site Configuration
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Update your author bio, job title, contact email, social preview image, and general site metadata.
            </p>
          </div>
          <div>
            <Link
              href="/admin/site-config"
              className="inline-flex px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-all"
            >
              Edit Site Config
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span>📝</span> Blog Platform
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Write new technical articles, edit existing MDX posts, configure categories and tags.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/blog/new"
              className="inline-flex px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-xl transition-all"
            >
              New Post
            </Link>
            <Link
              href="/admin/blog"
              className="inline-flex px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-all"
            >
              Manage Posts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

