import siteConfigData from "../../content/data/site-config.json";
import navLinksData from "../../content/data/nav-links.json";
import socialLinksData from "../../content/data/social-links.json";
import skillsData from "../../content/data/skills.json";
import projectsData from "../../content/data/projects.json";
import type { NavLink, Project, Skill, SocialLink, SiteConfig } from "./types";

export const siteConfig: SiteConfig = siteConfigData as SiteConfig;
export const navLinks: NavLink[] = navLinksData as NavLink[];
export const socialLinks: SocialLink[] = socialLinksData as SocialLink[];
export const skills: Skill[] = skillsData as Skill[];
export const projects: Project[] = projectsData as Project[];
