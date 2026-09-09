import siteConfigData from "../../content/data/site-config.json";
import navLinksData from "../../content/data/nav-links.json";
import socialLinksData from "../../content/data/social-links.json";
import skillsData from "../../content/data/skills.json";
import projectsData from "../../content/data/projects.json";
import photographyData from "../../content/data/photography.json";
import albumsData from "../../content/data/photography-albums.json";
import type { NavLink, Project, Skill, SocialLink, SiteConfig, PhotoItem, PhotoAlbum } from "./types";

export const siteConfig: SiteConfig = siteConfigData as SiteConfig;
export const navLinks: NavLink[] = (navLinksData as NavLink[])
  .filter((item) => item.published !== false)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .map((item) => ({
    ...item,
    children: item.children
      ?.filter((child) => child.published !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  }));
export const socialLinks: SocialLink[] = (socialLinksData as SocialLink[]).filter((item) => item.published !== false);
export const skills: Skill[] = (skillsData as Skill[]).filter((item) => item.published !== false);
export const projects: Project[] = (projectsData as Project[]).filter((item) => item.published !== false);
export const photography: PhotoItem[] = (photographyData as PhotoItem[])
  .filter((item) => item.published !== false)
  .sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
export const albums: PhotoAlbum[] = (albumsData as PhotoAlbum[])
  .filter((item) => item.published !== false)
  .sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

/**
 * Route prefixes that stay dark-only and are excluded from the light/dark
 * theme toggle (admin CMS, arcade game, standalone couple page).
 */
export const EXCLUDED_ROUTE_PREFIXES = ["/admin", "/contra", "/couple"] as const;

