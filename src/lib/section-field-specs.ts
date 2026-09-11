import type {
  AboutSectionContent,
  ContactSectionContent,
  HeroSectionContent,
  ProjectsSectionContent,
  SkillsSectionContent,
} from "@/lib/types";

export type Lang = "en" | "vi";

/**
 * Describes one editable field within a section-copy tab: how to read its
 * current value / placeholder (site default) for a given language, and how
 * to produce an updated content object when the admin types into it. This
 * lets the admin UI render real labeled inputs instead of a raw JSON blob,
 * while staying generic enough to share one form-rendering component across
 * all 5 section tabs.
 */
export interface FieldSpec<T> {
  id: string;
  label: string;
  multiline?: boolean;
  rows?: number;
  getValue: (content: T | undefined, lang: Lang) => string;
  getPlaceholder: (defaults: T, lang: Lang) => string;
  setValue: (content: T | undefined, lang: Lang, newValue: string) => T;
}

type Rec = Record<string, unknown>;

/** A top-level string field with a `field`/`field_vi` pair. */
function flatField<T extends object>(
  key: string,
  label: string,
  opts: { multiline?: boolean; rows?: number } = {}
): FieldSpec<T> {
  const viKey = `${key}_vi`;
  const keyFor = (lang: Lang) => (lang === "vi" ? viKey : key);
  return {
    id: key,
    label,
    multiline: opts.multiline,
    rows: opts.rows,
    getValue: (content, lang) => ((content as Rec | undefined)?.[keyFor(lang)] as string) ?? "",
    getPlaceholder: (defaults, lang) => ((defaults as Rec)[keyFor(lang)] as string) ?? "",
    setValue: (content, lang, newValue) =>
      ({
        ...((content as Rec) ?? {}),
        [keyFor(lang)]: newValue,
      }) as unknown as T,
  };
}

/** A string field nested one level down, e.g. `categories.frontend`/`categories.frontend_vi`. */
function nestedField<T extends object>(parentKey: string, key: string, label: string): FieldSpec<T> {
  const viKey = `${key}_vi`;
  const keyFor = (lang: Lang) => (lang === "vi" ? viKey : key);
  return {
    id: `${parentKey}.${key}`,
    label,
    getValue: (content, lang) => {
      const parent = (content as Rec | undefined)?.[parentKey] as Rec | undefined;
      return (parent?.[keyFor(lang)] as string) ?? "";
    },
    getPlaceholder: (defaults, lang) => {
      const parent = (defaults as Rec)[parentKey] as Rec | undefined;
      return (parent?.[keyFor(lang)] as string) ?? "";
    },
    setValue: (content, lang, newValue) => {
      const base = (content as Rec) ?? {};
      const parent = (base[parentKey] as Rec) ?? {};
      return { ...base, [parentKey]: { ...parent, [keyFor(lang)]: newValue } } as unknown as T;
    },
  };
}

/** One label/value slot inside About's fixed 4-item `stats` array. */
function statField<T extends object>(index: number, sub: "label" | "value", label: string): FieldSpec<T> {
  const viSub = `${sub}_vi`;
  const keyFor = (lang: Lang) => (lang === "vi" ? viSub : sub);
  return {
    id: `stats.${index}.${sub}`,
    label,
    getValue: (content, lang) => {
      const stats = (content as { stats?: Rec[] } | undefined)?.stats;
      return (stats?.[index]?.[keyFor(lang)] as string) ?? "";
    },
    getPlaceholder: (defaults, lang) => {
      const stats = (defaults as { stats?: Rec[] }).stats;
      return (stats?.[index]?.[keyFor(lang)] as string) ?? "";
    },
    setValue: (content, lang, newValue) => {
      const base = (content as { stats?: Rec[] }) ?? {};
      const stats = [...(base.stats ?? [{}, {}, {}, {}])];
      stats[index] = { ...(stats[index] ?? {}), [keyFor(lang)]: newValue };
      return { ...base, stats } as unknown as T;
    },
  };
}

export const HERO_FIELDS: FieldSpec<HeroSectionContent>[] = [
  flatField("available", "Availability Badge Text"),
  flatField("greetingPrefix", `Greeting Prefix (before the name, e.g. "Hi, I'm ")`),
  flatField("bio", "Hero Bio", { multiline: true, rows: 3 }),
  flatField("viewWork", `"View Work" Button Label`),
  flatField("viewCV", `"View CV" Button Label`),
];

export const ABOUT_FIELDS: FieldSpec<AboutSectionContent>[] = [
  flatField("badge", "Badge Text"),
  flatField("titlePrefix", "Heading Prefix"),
  flatField("titleHighlight", "Heading Highlight"),
  flatField("role", "Role / Job Title"),
  flatField("bioP1", "Bio Paragraph 1", { multiline: true, rows: 3 }),
  flatField("bioP2", "Bio Paragraph 2", { multiline: true, rows: 3 }),
  flatField("bioP3", "Bio Paragraph 3", { multiline: true, rows: 3 }),
  statField(0, "label", "Stat 1 Label (Years)"),
  statField(0, "value", "Stat 1 Value (Years)"),
  statField(1, "label", "Stat 2 Label (Projects)"),
  statField(1, "value", "Stat 2 Value (Projects)"),
  statField(2, "label", "Stat 3 Label (Clients)"),
  statField(2, "value", "Stat 3 Value (Clients)"),
  statField(3, "label", "Stat 4 Label (Tech)"),
  statField(3, "value", "Stat 4 Value (Tech)"),
];

export const SKILLS_FIELDS: FieldSpec<SkillsSectionContent>[] = [
  flatField("badge", "Badge Text"),
  flatField("titlePrefix", "Heading Prefix"),
  flatField("titleHighlight", "Heading Highlight"),
  flatField("subtitle", "Subtitle", { multiline: true, rows: 2 }),
  nestedField("categories", "frontend", "Category Label: Frontend"),
  nestedField("categories", "backend", "Category Label: Backend"),
  nestedField("categories", "tools", "Category Label: Tools"),
  nestedField("categories", "design", "Category Label: Design"),
];

export const PROJECTS_FIELDS: FieldSpec<ProjectsSectionContent>[] = [
  flatField("badge", "Badge Text"),
  flatField("titlePrefix", "Heading Prefix"),
  flatField("titleHighlight", "Heading Highlight"),
  flatField("subtitle", "Subtitle", { multiline: true, rows: 2 }),
  flatField("viewLive", `"View Live" Button Label`),
  flatField("sourceCode", `"Source Code" Button Label`),
  flatField("featuredBadge", "Featured Badge Text"),
  flatField("closeModal", "Close Modal Button Label"),
  flatField("viewAll", `"View All" Link Label`),
];

export const CONTACT_FIELDS: FieldSpec<ContactSectionContent>[] = [
  flatField("badge", "Badge Text"),
  flatField("titlePrefix", "Heading Prefix"),
  flatField("titleHighlight", "Heading Highlight"),
  flatField("subtitle", "Subtitle", { multiline: true, rows: 2 }),
  flatField("nameLabel", "Name Field Label"),
  flatField("namePlaceholder", "Name Field Placeholder"),
  flatField("emailLabel", "Email Field Label"),
  flatField("emailPlaceholder", "Email Field Placeholder"),
  flatField("subjectLabel", "Subject Field Label"),
  flatField("subjectPlaceholder", "Subject Field Placeholder"),
  flatField("messageLabel", "Message Field Label"),
  flatField("messagePlaceholder", "Message Field Placeholder"),
  flatField("sendButton", "Send Button Label"),
  flatField("sendingButton", `"Sending..." Button Label`),
  flatField("successTitle", "Success Banner Title"),
  flatField("successMessage", "Success Banner Message"),
  flatField("errorGeneric", "Generic Error Message"),
  flatField("errorRateLimited", "Rate-Limited Error Message"),
  flatField("unconnectedNotice", "Unconnected Notice Text"),
  flatField("mailtoPrefix", "Mailto Fallback: Prefix"),
  flatField("mailtoLinkText", "Mailto Fallback: Link Text"),
  flatField("mailtoSuffix", "Mailto Fallback: Suffix"),
  flatField("emailInfo", "Email Info Card Title"),
  flatField("locationInfo", "Location Info Card Title"),
  flatField("availabilityInfo", "Availability Info Card Title"),
  flatField("workHours", "Work Hours Text"),
  flatField("openForProjects", "Open For Projects Text"),
  nestedField("validation", "nameMin", "Validation: Name Too Short"),
  nestedField("validation", "emailValid", "Validation: Invalid Email"),
  nestedField("validation", "subjectMin", "Validation: Subject Too Short"),
  nestedField("validation", "messageMin", "Validation: Message Too Short"),
];
