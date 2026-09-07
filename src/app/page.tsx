import dynamic from "next/dynamic";
import { HeroSection, AboutSection } from "@/components/sections";
import { SectionSkeleton } from "@/components/ui";
import { getAllPosts } from "@/lib/blog";

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

export default function Home() {
  const recentPosts = getAllPosts().slice(0, 3);

  return (
    <>
      {/* Above-the-fold immediate render for instant FCP */}
      <HeroSection />
      <AboutSection />

      {/* Below-the-fold code-split sections */}
      <SkillsSection />
      <ProjectsSection />
      <PhotoPreviewSection />
      <BlogPreviewSection posts={recentPosts} />
      <ContactSection />
    </>
  );
}

