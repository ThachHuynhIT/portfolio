"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminFormFooter from "@/components/admin/AdminFormFooter";
import FormField from "@/components/admin/FormField";
import MediaImagePicker from "@/components/admin/MediaImagePicker";
import { useToast } from "@/context/ToastContext";
import type { SiteConfig } from "@/lib/types";

export default function SiteConfigAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/admin/site-config");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        setConfig(data);
      } catch (err) {
        console.error("Failed to load site config:", err);
        toast.error("Failed to load site configuration");
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);

    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error("Failed to save changes");

      toast.success("Site configuration saved successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save configuration");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-purple-400 animate-pulse font-medium">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <AdminHeader
        title="Site Configuration"
        description="Edit site branding, metadata, and author details."
        icon="settings"
        closeHref="/admin"
      />

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        {/* General Site Info */}
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-6">
          <h2 className="text-lg font-bold text-white mb-4">General Information</h2>

          <FormField label="Site Name" id="site-name" required>
            <input
              id="site-name"
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              required
            />
          </FormField>

          <FormField label="Page Title" id="site-title" required>
            <input
              id="site-title"
              type="text"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              required
            />
          </FormField>

          <FormField label="Site Description" id="site-desc">
            <textarea
              id="site-desc"
              rows={3}
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Site URL" id="site-url">
              <input
                id="site-url"
                type="url"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </FormField>

            <div className="md:col-span-2">
              <MediaImagePicker
                label="OpenGraph Social Image"
                value={config.ogImage}
                onChange={(url) => setConfig({ ...config, ogImage: url })}
                category="site"
                subType="og"
                helperText="Image preview displayed when sharing your site link on social networks (Facebook, Twitter, LinkedIn...)."
              />
            </div>
          </div>
        </div>

        {/* Author Details */}
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-6">
          <h2 className="text-lg font-bold text-white mb-4">Author Profile</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Author Name" id="author-name" required>
              <input
                id="author-name"
                type="text"
                value={config.author.name}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    author: { ...config.author, name: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                required
              />
            </FormField>

            <FormField label="Author Title" id="author-title" required>
              <input
                id="author-title"
                type="text"
                value={config.author.title}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    author: { ...config.author, title: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                required
              />
            </FormField>
          </div>

          <FormField label="Short Bio" id="author-bio">
            <textarea
              id="author-bio"
              rows={3}
              value={config.author.bio}
              onChange={(e) =>
                setConfig({
                  ...config,
                  author: { ...config.author, bio: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
            />
          </FormField>

          <div className="space-y-4">
            <MediaImagePicker
              label="Author Avatar"
              value={config.author.avatar}
              onChange={(url) =>
                setConfig({
                  ...config,
                  author: { ...config.author, avatar: url },
                })
              }
              category="site"
              subType="avatar"
              helperText="Personal portrait photo / author profile avatar."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <FormField label="Email Address" id="author-email">
              <input
                id="author-email"
                type="email"
                value={config.author.email}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    author: { ...config.author, email: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </FormField>

            <FormField label="Location" id="author-location">
              <input
                id="author-location"
                type="text"
                value={config.author.location}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    author: { ...config.author, location: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </FormField>
          </div>
        </div>

        <AdminFormFooter
          closeHref="/admin"
          closeLabel="Cancel"
          saveLabel="Save Configuration"
          isSaving={saving}
        />
      </form>
    </div>
  );
}
