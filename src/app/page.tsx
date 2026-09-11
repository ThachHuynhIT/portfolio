import dynamic from "next/dynamic";
import { HeroSection, AboutSection } from "@/components/sections";
import { SectionSkeleton } from "@/components/ui";
import { getAllPosts } from "@/lib/blog";
import { getPublishedSkills } from "@/lib/content/skills";
import { getPublishedProjects } from "@/lib/content/projects";
import { getPublishedPhotos } from "@/lib/content/photography";
import { getPublishedSiteConfig } from "@/lib/content/site-config";

// Below-the-fold dynamic imports with sleek Skeleton placeholders
const SkillsSection = dynamic(
  () => import("@/components/sections/SkillsSection"),
  {
    loading: () => <SectionSkeleton title="Skills" cardCount={4} />,
  }
);

const ProjectsSection = dynamic(
  () => import("@/components/sections/ProjectsSection"),
  {
    loading: () => <SectionSkeleton title="Featured Projects" cardCount={3} />,
  }
);

const PhotoPreviewSection = dynamic(
  () => import("@/components/sections/PhotoPreviewSection"),
  {
    loading: () => <SectionSkeleton title="Photography" cardCount={3} />,
  }
);

const BlogPreviewSection = dynamic(
  () => import("@/components/sections/BlogPreviewSection"),
  {
    loading: () => <SectionSkeleton title="Blog" cardCount={3} />,
  }
);

const ContactSection = dynamic(
  () => import("@/components/sections/ContactSection"),
  {
    loading: () => <SectionSkeleton title="Contact" cardCount={2} />,
  }
);

export default async function Home() {
  const [allPosts, skills, projects, photography, siteConfig] = await Promise.all([
    getAllPosts(),
    getPublishedSkills(),
    getPublishedProjects(),
    getPublishedPhotos(),
    getPublishedSiteConfig(),
  ]);
  const recentPosts = allPosts.slice(0, 3);

  return (
    <>
      {/* Above-the-fold immediate render for instant FCP */}
      <HeroSection siteConfig={siteConfig} />
      <AboutSection siteConfig={siteConfig} />

      {/* Below-the-fold code-split sections */}
      <SkillsSection skills={skills} siteConfig={siteConfig} />
      <ProjectsSection projects={projects} siteConfig={siteConfig} />
      <PhotoPreviewSection photography={photography} />
      <BlogPreviewSection posts={recentPosts} />
      <ContactSection siteConfig={siteConfig} />
    </>
  );
}

