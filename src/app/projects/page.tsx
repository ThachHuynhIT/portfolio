import { Metadata } from "next";
import { readJsonFile } from "@/lib/data-manager";
import type { Project } from "@/lib/types";
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

export default function ProjectsPage() {
  const allProjects = readJsonFile<Project[]>("projects.json", []);
  const publishedProjects = allProjects.filter((p) => p.published !== false);

  return <ProjectsGallery initialProjects={publishedProjects} />;
}
