import {
  HeroSection,
  AboutSection,
  SkillsSection,
  ProjectsSection,
  PhotoPreviewSection,
  BlogPreviewSection,
  ContactSection,
} from "@/components/sections";
import { getAllPosts } from "@/lib/blog";

export default function Home() {
  const recentPosts = getAllPosts().slice(0, 3);

  return (
    <>
      <HeroSection />
      <AboutSection />
      <SkillsSection />
      <ProjectsSection />
      <PhotoPreviewSection />
      <BlogPreviewSection posts={recentPosts} />
      <ContactSection />
    </>
  );
}
