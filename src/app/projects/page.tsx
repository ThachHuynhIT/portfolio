import { getPublishedProjects } from "@/lib/content/projects";
import ProjectsGallery from "@/components/projects/ProjectsGallery";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "All Projects",
  description:
    "Explore the complete portfolio of web applications, 3D interactive experiences, and creative coding experiments built by Thach Huynh.",
  path: "/projects",
});

export const revalidate = 60; // ISR

export default async function ProjectsPage() {
  const publishedProjects = await getPublishedProjects();

  return <ProjectsGallery initialProjects={publishedProjects} />;
}
