import { en } from "@/locales/en";
import { vi } from "@/locales/vi";
import type {
  AboutSectionContent,
  ContactSectionContent,
  HeroSectionContent,
  ProjectsSectionContent,
  SkillsSectionContent,
} from "@/lib/types";

/**
 * Fixed 4-slot stat definitions for the About section, in the order the
 * homepage renders them. The stat *values* ("3+", "9+", ...) have no home in
 * the locale files — they're literal fallbacks baked into the component —
 * so this is the single source of truth both AboutSection.tsx and the admin
 * defaults below read from, keeping them from drifting apart.
 */
export const ABOUT_STAT_DEFS = [
  { key: "years", fallbackValue: "3+" },
  { key: "projects", fallbackValue: "3+" },
  { key: "clients", fallbackValue: "3+" },
  { key: "tech", fallbackValue: "9+" },
] as const;

/**
 * Builds the *currently effective* copy for a homepage section, sourced from
 * src/locales/{en,vi}.ts (plus ABOUT_STAT_DEFS for About's stat values).
 * Used to pre-fill the admin JSON editors so admins see real starting values
 * instead of an empty "{}" they'd have to guess field names for.
 */
export function getHeroDefaults(): HeroSectionContent {
  return {
    available: en.hero.available,
    available_vi: vi.hero.available,
    greetingPrefix: en.hero.greetingPrefix,
    greetingPrefix_vi: vi.hero.greetingPrefix,
    bio: en.hero.bio,
    bio_vi: vi.hero.bio,
    viewWork: en.hero.viewWork,
    viewWork_vi: vi.hero.viewWork,
    viewCV: en.hero.viewCV,
    viewCV_vi: vi.hero.viewCV,
  };
}

export function getAboutDefaults(): AboutSectionContent {
  return {
    badge: en.about.badge,
    badge_vi: vi.about.badge,
    titlePrefix: en.about.titlePrefix,
    titlePrefix_vi: vi.about.titlePrefix,
    titleHighlight: en.about.titleHighlight,
    titleHighlight_vi: vi.about.titleHighlight,
    role: en.about.role,
    role_vi: vi.about.role,
    bioP1: en.about.bioP1,
    bioP1_vi: vi.about.bioP1,
    bioP2: en.about.bioP2,
    bioP2_vi: vi.about.bioP2,
    bioP3: en.about.bioP3,
    bioP3_vi: vi.about.bioP3,
    stats: ABOUT_STAT_DEFS.map((def) => ({
      label: en.about.stats[def.key],
      label_vi: vi.about.stats[def.key],
      value: def.fallbackValue,
      value_vi: def.fallbackValue,
    })) as AboutSectionContent["stats"],
  };
}

export function getSkillsDefaults(): SkillsSectionContent {
  return {
    badge: en.skills.badge,
    badge_vi: vi.skills.badge,
    titlePrefix: en.skills.titlePrefix,
    titlePrefix_vi: vi.skills.titlePrefix,
    titleHighlight: en.skills.titleHighlight,
    titleHighlight_vi: vi.skills.titleHighlight,
    subtitle: en.skills.subtitle,
    subtitle_vi: vi.skills.subtitle,
    categories: {
      frontend: en.skills.categories.frontend,
      frontend_vi: vi.skills.categories.frontend,
      backend: en.skills.categories.backend,
      backend_vi: vi.skills.categories.backend,
      tools: en.skills.categories.tools,
      tools_vi: vi.skills.categories.tools,
      design: en.skills.categories.design,
      design_vi: vi.skills.categories.design,
    },
  };
}

export function getProjectsDefaults(): ProjectsSectionContent {
  return {
    badge: en.projects.badge,
    badge_vi: vi.projects.badge,
    titlePrefix: en.projects.titlePrefix,
    titlePrefix_vi: vi.projects.titlePrefix,
    titleHighlight: en.projects.titleHighlight,
    titleHighlight_vi: vi.projects.titleHighlight,
    subtitle: en.projects.subtitle,
    subtitle_vi: vi.projects.subtitle,
    viewLive: en.projects.viewLive,
    viewLive_vi: vi.projects.viewLive,
    sourceCode: en.projects.sourceCode,
    sourceCode_vi: vi.projects.sourceCode,
    featuredBadge: en.projects.featuredBadge,
    featuredBadge_vi: vi.projects.featuredBadge,
    closeModal: en.projects.closeModal,
    closeModal_vi: vi.projects.closeModal,
    viewAll: en.projects.viewAll,
    viewAll_vi: vi.projects.viewAll,
  };
}

export function getContactDefaults(): ContactSectionContent {
  return {
    badge: en.contact.badge,
    badge_vi: vi.contact.badge,
    titlePrefix: en.contact.titlePrefix,
    titlePrefix_vi: vi.contact.titlePrefix,
    titleHighlight: en.contact.titleHighlight,
    titleHighlight_vi: vi.contact.titleHighlight,
    subtitle: en.contact.subtitle,
    subtitle_vi: vi.contact.subtitle,
    nameLabel: en.contact.nameLabel,
    nameLabel_vi: vi.contact.nameLabel,
    namePlaceholder: en.contact.namePlaceholder,
    namePlaceholder_vi: vi.contact.namePlaceholder,
    emailLabel: en.contact.emailLabel,
    emailLabel_vi: vi.contact.emailLabel,
    emailPlaceholder: en.contact.emailPlaceholder,
    emailPlaceholder_vi: vi.contact.emailPlaceholder,
    subjectLabel: en.contact.subjectLabel,
    subjectLabel_vi: vi.contact.subjectLabel,
    subjectPlaceholder: en.contact.subjectPlaceholder,
    subjectPlaceholder_vi: vi.contact.subjectPlaceholder,
    messageLabel: en.contact.messageLabel,
    messageLabel_vi: vi.contact.messageLabel,
    messagePlaceholder: en.contact.messagePlaceholder,
    messagePlaceholder_vi: vi.contact.messagePlaceholder,
    sendButton: en.contact.sendButton,
    sendButton_vi: vi.contact.sendButton,
    sendingButton: en.contact.sendingButton,
    sendingButton_vi: vi.contact.sendingButton,
    successTitle: en.contact.successTitle,
    successTitle_vi: vi.contact.successTitle,
    successMessage: en.contact.successMessage,
    successMessage_vi: vi.contact.successMessage,
    errorGeneric: en.contact.errorGeneric,
    errorGeneric_vi: vi.contact.errorGeneric,
    errorRateLimited: en.contact.errorRateLimited,
    errorRateLimited_vi: vi.contact.errorRateLimited,
    unconnectedNotice: en.contact.unconnectedNotice,
    unconnectedNotice_vi: vi.contact.unconnectedNotice,
    mailtoPrefix: en.contact.mailtoPrefix,
    mailtoPrefix_vi: vi.contact.mailtoPrefix,
    mailtoLinkText: en.contact.mailtoLinkText,
    mailtoLinkText_vi: vi.contact.mailtoLinkText,
    mailtoSuffix: en.contact.mailtoSuffix,
    mailtoSuffix_vi: vi.contact.mailtoSuffix,
    emailInfo: en.contact.emailInfo,
    emailInfo_vi: vi.contact.emailInfo,
    locationInfo: en.contact.locationInfo,
    locationInfo_vi: vi.contact.locationInfo,
    availabilityInfo: en.contact.availabilityInfo,
    availabilityInfo_vi: vi.contact.availabilityInfo,
    workHours: en.contact.workHours,
    workHours_vi: vi.contact.workHours,
    openForProjects: en.contact.openForProjects,
    openForProjects_vi: vi.contact.openForProjects,
    validation: {
      nameMin: en.contact.validation.nameMin,
      nameMin_vi: vi.contact.validation.nameMin,
      emailValid: en.contact.validation.emailValid,
      emailValid_vi: vi.contact.validation.emailValid,
      subjectMin: en.contact.validation.subjectMin,
      subjectMin_vi: vi.contact.validation.subjectMin,
      messageMin: en.contact.validation.messageMin,
      messageMin_vi: vi.contact.validation.messageMin,
    },
  };
}
