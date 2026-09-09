import { Metadata } from "next";
import { getPublishedProjects } from "@/lib/content/projects";
import ProjectsGallery from "@/components/projects/ProjectsGallery";

export const metadata: Metadata = {
  title: "All Projects | Thach Huynh",
  description:
    "Explore the complete portfolio of web applications, 3D interactive experiences, and creative coding experiments built by Thach Huynh.",
  openGraph: {
    title: "All Projects | Thach Huynh",
    description:
      "Explore the complete portfolio of web applications, 3D interactive experiences, and creative coding experiments.",
    type: "website",
  },
};

export const revalidate = 60; // ISR

export default async function ProjectsPage() {
  const publishedProjects = await getPublishedProjects();

  return <ProjectsGallery initialProjects={publishedProjects} />;
}
