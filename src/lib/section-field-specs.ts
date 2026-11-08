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
  /** undefined = never overridden (site default applies); "" = explicitly cleared (hidden). */
  getValue: (content: T | undefined, lang: Lang) => string | undefined;
  getPlaceholder: (defaults: T, lang: Lang) => string;
  /** Pass undefined to drop the override and go back to the site default. */
  setValue: (content: T | undefined, lang: Lang, newValue: string | undefined) => T;
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
    getValue: (content, lang) => (content as Rec | undefined)?.[keyFor(lang)] as string | undefined,
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
      return parent?.[keyFor(lang)] as string | undefined;
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

/** One label/value slot inside About's fixed 4-item `facts` array. */
function factField<T extends object>(index: number, sub: "label" | "value", label: string): FieldSpec<T> {
  const viSub = `${sub}_vi`;
  const keyFor = (lang: Lang) => (lang === "vi" ? viSub : sub);
  return {
    id: `facts.${index}.${sub}`,
    label,
    getValue: (content, lang) => {
      const facts = (content as { facts?: Rec[] } | undefined)?.facts;
      return facts?.[index]?.[keyFor(lang)] as string | undefined;
    },
    getPlaceholder: (defaults, lang) => {
      const facts = (defaults as { facts?: Rec[] }).facts;
      return (facts?.[index]?.[keyFor(lang)] as string) ?? "";
    },
    setValue: (content, lang, newValue) => {
      const base = (content as { facts?: Rec[] }) ?? {};
      const facts = [...(base.facts ?? [{}, {}, {}, {}])];
      facts[index] = { ...(facts[index] ?? {}), [keyFor(lang)]: newValue };
      return { ...base, facts } as unknown as T;
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
  factField(0, "label", "Fact 1 Label (Experience)"),
  factField(0, "value", "Fact 1 Value (Experience)"),
  factField(1, "label", "Fact 2 Label (Focus)"),
  factField(1, "value", "Fact 2 Value (Focus)"),
  factField(2, "label", "Fact 3 Label (Education)"),
  factField(2, "value", "Fact 3 Value (Education)"),
  factField(3, "label", "Fact 4 Label (Based in)"),
  factField(3, "value", "Fact 4 Value (Based in)"),
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
