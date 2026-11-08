import type { NavLink } from "./types";

export function filterBlogNavLinks(links: readonly NavLink[], hasPosts: boolean): NavLink[] {
  return links.flatMap((link) => {
    if (!hasPosts && ["/blog", "#blog", "/#blog"].includes(link.href)) return [];
    const children = link.children ? filterBlogNavLinks(link.children, hasPosts) : undefined;
    if (link.children?.length && !children?.length && (!link.href.trim() || link.href === "#")) return [];
    return [{ ...link, ...(children ? { children } : {}) }];
  });
}

/** Nav destinations are structural, never inferred from translated labels. */
export function getSectionNavTarget(sectionId: string): string {
  return sectionId === "photos" || sectionId === "blog" ? "hobby" : sectionId;
}

export function getActiveSection(
  sections: readonly { id: string; top: number; height: number; hidden?: boolean }[],
  scrollPosition: number
): string {
  let active = "home";
  let activeTop = -Infinity;
  for (const section of sections) {
    if (!section.hidden && section.height > 0 && section.top <= scrollPosition && section.top >= activeTop) {
      active = section.id;
      activeTop = section.top;
    }
  }
  return active;
}

export function isSectionNavActive(
  link: { href: string; children?: readonly { href: string }[] },
  sectionId: string
): boolean {
  const hrefTarget = (href: string) => {
    if (href === "/" || href === "#" || href === "#home") return "home";
    if (href === "/photography") return "photos";
    if (href === "/blog") return "blog";
    return href.replace(/^\/#|^#/, "");
  };
  const matches = (href: string) => {
    const target = hrefTarget(href);
    return target === sectionId || (target === "hobby" && getSectionNavTarget(sectionId) === "hobby");
  };
  // A '#' dropdown trigger is a placeholder, not an additional Home link.
  return (link.children?.length ? link.href !== "#" && matches(link.href) : matches(link.href))
    || (link.children?.some((child) => matches(child.href)) ?? false);
}
