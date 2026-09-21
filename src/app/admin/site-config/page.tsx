"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminFormFooter from "@/components/admin/AdminFormFooter";
import FormField from "@/components/admin/FormField";
import MediaImagePicker from "@/components/admin/MediaImagePicker";
import ResumeFilePicker from "@/components/admin/ResumeFilePicker";
import LanguageTabSelector from "@/components/admin/LanguageTabSelector";
import SectionFieldsEditor from "@/components/admin/SectionFieldsEditor";
import FlagIcon from "@/components/ui/FlagIcon";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/context/LanguageContext";
import {
  getAboutDefaults,
  getContactDefaults,
  getHeroDefaults,
  getProjectsDefaults,
  getSkillsDefaults,
} from "@/lib/section-defaults";
import {
  ABOUT_FIELDS,
  CONTACT_FIELDS,
  HERO_FIELDS,
  PROJECTS_FIELDS,
  SKILLS_FIELDS,
} from "@/lib/section-field-specs";
import type { SiteConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { gap, radius, text } from "@/lib/design-tokens";

type TabId = "general" | "author" | "hero" | "about" | "skills" | "projects" | "contact";

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "general", icon: "settings", label: "General" },
  { id: "author", icon: "user", label: "Author" },
  { id: "hero", icon: "rocket", label: "Hero" },
  { id: "about", icon: "fileText", label: "About" },
  { id: "skills", icon: "skills", label: "Skills" },
  { id: "projects", icon: "projects", label: "Projects" },
  { id: "contact", icon: "mail", label: "Contact" },
];

export default function SiteConfigAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLang, setActiveLang] = useState<"en" | "vi">("en");
  const [activeTab, setActiveTab] = useState<TabId>("general");

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
  }, [router, toast]);

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
        <div className="text-purple-400 animate-pulse font-medium">{t("admin.common.loading", "Loading configuration...")}</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <AdminHeader
        title={t("admin.siteConfig.title", "Site Configuration")}
        description={t("admin.siteConfig.description", "Edit site branding, metadata, multilingual translations, and author details.")}
        icon="settings"
        closeHref="/admin"
      />

      {/* Section Tabs */}
      <div className="flex border-b border-white/10 gap-1 overflow-x-auto pb-0.5 no-scrollbar mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Multilingual Switcher Header — applies to every tab now, since each
          section-copy tab shows one language's fields at a time, same as
          General/Author. */}
      <LanguageTabSelector
        activeLang={activeLang}
        onChange={setActiveLang}
        hasTranslation={{
          en: Boolean(config.title?.trim() && config.author?.title?.trim()),
          vi: Boolean(config.title_vi?.trim() && config.author?.title_vi?.trim()),
        }}
        label="Content Language / Ngôn ngữ đang sửa:"
        className="mb-6"
      />

      {activeLang === "vi" && (
        <div className={cn("flex items-center", gap.tight, "px-4 py-2.5", radius.control, "bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs mb-6")}>
          <FlagIcon locale="vi" width={16} height={11} />
          <span>
            Đang chỉnh sửa bản dịch <strong>Tiếng Việt</strong>. Nếu để trống trường nào, hệ thống sẽ tự động dùng giá trị mặc định của bản Tiếng Anh.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Site Info */}
        {activeTab === "general" && (
        <div className={cn("p-6", radius.card, "bg-gray-900 border border-gray-800 space-y-6")}>
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <h2 className={cn("text-lg font-bold", text.primaryDark)}>{t("admin.siteConfig.tabBasic", "General Information")}</h2>
            <span className={cn("inline-flex items-center gap-1.5 text-xs text-slate-400 px-2.5 py-1", radius.pill, "bg-white/[0.04] border border-white/8")}>
              <FlagIcon locale={activeLang} width={14} height={9} />
              {activeLang === "en" ? "English Content" : "Bản Tiếng Việt"}
            </span>
          </div>

          <FormField label={`${t("admin.common.name", "Site Name")} (Shared)`} id="site-name" required helper="Internal brand / site name">
            <input
              id="site-name"
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
              required
            />
          </FormField>

          {activeLang === "en" ? (
            <>
              <FormField label={`${t("admin.siteConfig.fieldMetaTitle", "Page Title")} (English)`} id="site-title" required>
                <input
                  id="site-title"
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
                  required
                />
              </FormField>

              <FormField label={`${t("admin.siteConfig.fieldMetaDesc", "Site Description")} (English)`} id="site-desc">
                <textarea
                  id="site-desc"
                  rows={3}
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
                />
              </FormField>
            </>
          ) : (
            <>
              <FormField
                label={`${t("admin.siteConfig.fieldMetaTitle", "Tiêu đề trang")} (Tiếng Việt)`}
                id="site-title-vi"
                helper="Tiêu đề trang hiển thị khi người dùng chọn Tiếng Việt"
              >
                <input
                  id="site-title-vi"
                  type="text"
                  value={config.title_vi || ""}
                  placeholder={config.title}
                  onChange={(e) => setConfig({ ...config, title_vi: e.target.value })}
                  className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
                />
              </FormField>

              <FormField
                label={`${t("admin.siteConfig.fieldMetaDesc", "Mô tả website")} (Tiếng Việt)`}
                id="site-desc-vi"
                helper="Mô tả SEO khi khách duyệt website bằng Tiếng Việt"
              >
                <textarea
                  id="site-desc-vi"
                  rows={3}
                  value={config.description_vi || ""}
                  placeholder={config.description}
                  onChange={(e) => setConfig({ ...config, description_vi: e.target.value })}
                  className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
                />
              </FormField>
            </>
          )}

          <div className={cn("grid grid-cols-1 md:grid-cols-2", gap.loose)}>
            <FormField label={t("admin.common.url", "Site URL")} id="site-url">
              <input
                id="site-url"
                type="url"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
              />
            </FormField>

            <div className="md:col-span-2">
              <MediaImagePicker
                label={t("admin.siteConfig.fieldOgImage", "OpenGraph Social Image")}
                value={config.ogImage}
                onChange={(url) => setConfig({ ...config, ogImage: url })}
                category="site"
                subType="og"
                helperText="Image preview displayed when sharing your site link on social networks (Facebook, Twitter, LinkedIn...)."
              />
            </div>
          </div>
        </div>
        )}

        {/* Author Details */}
        {activeTab === "author" && (
        <div className={cn("p-6", radius.card, "bg-gray-900 border border-gray-800 space-y-6")}>
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <h2 className={cn("text-lg font-bold", text.primaryDark)}>{t("admin.siteConfig.tabContact", "Author Profile")}</h2>
            <span className={cn("inline-flex items-center gap-1.5 text-xs text-slate-400 px-2.5 py-1", radius.pill, "bg-white/[0.04] border border-white/8")}>
              <FlagIcon locale={activeLang} width={14} height={9} />
              {activeLang === "en" ? "English Profile" : "Hồ sơ Tiếng Việt"}
            </span>
          </div>

          <FormField label={`${t("admin.siteConfig.fieldName", "Author Name")} (Shared)`} id="author-name" required>
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
              className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
              required
            />
          </FormField>

          {activeLang === "en" ? (
            <>
              <FormField label={`${t("admin.siteConfig.fieldJobTitle", "Author Title")} (English)`} id="author-title" required>
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
                  className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
                  required
                />
              </FormField>

              <FormField label={`${t("admin.siteConfig.fieldBio", "Short Bio")} (English)`} id="author-bio">
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
                  className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
                />
              </FormField>

              <FormField label={`${t("admin.siteConfig.fieldLocation", "Location")} (English)`} id="author-location">
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
                  className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
                />
              </FormField>
            </>
          ) : (
            <>
              <FormField
                label={`${t("admin.siteConfig.fieldJobTitle", "Chức danh tác giả")} (Tiếng Việt)`}
                id="author-title-vi"
                helper="Ví dụ: Lập trình viên Web Sáng tạo"
              >
                <input
                  id="author-title-vi"
                  type="text"
                  value={config.author.title_vi || ""}
                  placeholder={config.author.title}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      author: { ...config.author, title_vi: e.target.value },
                    })
                  }
                  className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
                />
              </FormField>

              <FormField
                label={`${t("admin.siteConfig.fieldBio", "Tiểu sử / Giới thiệu ngắn")} (Tiếng Việt)`}
                id="author-bio-vi"
                helper="Hiển thị ở banner trang chủ (Hero) và chân trang (Footer)"
              >
                <textarea
                  id="author-bio-vi"
                  rows={3}
                  value={config.author.bio_vi || ""}
                  placeholder={config.author.bio}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      author: { ...config.author, bio_vi: e.target.value },
                    })
                  }
                  className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
                />
              </FormField>

              <FormField
                label={`${t("admin.siteConfig.fieldLocation", "Địa điểm tác giả")} (Tiếng Việt)`}
                id="author-location-vi"
                helper="Ví dụ: Thành phố Hồ Chí Minh, Việt Nam"
              >
                <input
                  id="author-location-vi"
                  type="text"
                  value={config.author.location_vi || ""}
                  placeholder={config.author.location}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      author: { ...config.author, location_vi: e.target.value },
                    })
                  }
                  className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
                />
              </FormField>
            </>
          )}

          <div className="space-y-4">
            <MediaImagePicker
              label={t("admin.siteConfig.fieldAvatar", "Author Avatar")}
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

          <div className="space-y-4">
            <ResumeFilePicker
              label="Resume / CV (PDF)"
              value={config.resumeUrl}
              onChange={(url) => setConfig({ ...config, resumeUrl: url })}
              id="author-resume"
              helperText="Shown as the 'View CV' button on the homepage, previewed in-page as a PDF (English only, no download forced)."
            />
          </div>

          <div className={cn("grid grid-cols-1 md:grid-cols-2", gap.loose)}>
            <FormField label={t("admin.siteConfig.fieldEmail", "Email Address")} id="author-email">
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
                className={cn("w-full px-4 py-2.5 bg-gray-800 border border-gray-700", radius.control, text.primaryDark, "focus:outline-none focus:border-purple-500")}
              />
            </FormField>
          </div>
        </div>
        )}

        {/* Hero Section Copy */}
        {activeTab === "hero" && (
          <SectionFieldsEditor
            title="Hero Section Copy"
            helperText="Overrides the homepage Hero badge, greeting, bio, and buttons. Leave a field blank to use the site's default text for the language you're currently editing. Note: setting the Vietnamese Bio here takes priority over the Author tab's Vietnamese bio."
            value={config.sectionsContent?.hero}
            defaultValue={getHeroDefaults()}
            fields={HERO_FIELDS}
            activeLang={activeLang}
            onChange={(hero) =>
              setConfig({ ...config, sectionsContent: { ...config.sectionsContent, hero } })
            }
          />
        )}

        {/* About Section Copy */}
        {activeTab === "about" && (
          <SectionFieldsEditor
            title="About Section Copy"
            helperText="Overrides the About badge/heading/role/bio paragraphs and the 4 stat cards shown (e.g. '3+ Years Experience')."
            value={config.sectionsContent?.about}
            defaultValue={getAboutDefaults()}
            fields={ABOUT_FIELDS}
            activeLang={activeLang}
            onChange={(about) =>
              setConfig({ ...config, sectionsContent: { ...config.sectionsContent, about } })
            }
          />
        )}

        {/* Skills Section Copy */}
        {activeTab === "skills" && (
          <SectionFieldsEditor
            title="Skills Section Copy"
            helperText="Overrides the Skills section heading/subtitle and category labels only. The skill list itself is managed on the Skills page."
            manageHref="/admin/skills"
            manageLabel="Manage Skills List"
            value={config.sectionsContent?.skills}
            defaultValue={getSkillsDefaults()}
            fields={SKILLS_FIELDS}
            activeLang={activeLang}
            onChange={(skills) =>
              setConfig({ ...config, sectionsContent: { ...config.sectionsContent, skills } })
            }
          />
        )}

        {/* Projects Section Copy */}
        {activeTab === "projects" && (
          <SectionFieldsEditor
            title="Projects Section Copy"
            helperText="Overrides the Projects section heading/subtitle/button labels only. The project list itself is managed on the Projects page."
            manageHref="/admin/projects"
            manageLabel="Manage Projects List"
            value={config.sectionsContent?.projects}
            defaultValue={getProjectsDefaults()}
            fields={PROJECTS_FIELDS}
            activeLang={activeLang}
            onChange={(projects) =>
              setConfig({ ...config, sectionsContent: { ...config.sectionsContent, projects } })
            }
          />
        )}

        {/* Contact Section Copy */}
        {activeTab === "contact" && (
          <SectionFieldsEditor
            title="Contact Section Copy"
            helperText="Overrides Contact heading/form labels/placeholders/validation messages/buttons/banners/availability card."
            value={config.sectionsContent?.contact}
            defaultValue={getContactDefaults()}
            fields={CONTACT_FIELDS}
            activeLang={activeLang}
            onChange={(contact) =>
              setConfig({ ...config, sectionsContent: { ...config.sectionsContent, contact } })
            }
          />
        )}

        <AdminFormFooter
          closeHref="/admin"
          closeLabel={t("admin.common.cancel", "Cancel")}
          saveLabel={t("admin.common.save", "Save Configuration")}
          isSaving={saving}
        />
      </form>
    </div>
  );
}
