import { describe, expect, it } from "vitest";
import { getAboutDefaults } from "./section-defaults";
import { ABOUT_FIELDS } from "./section-field-specs";

describe("about CMS facts", () => {
  it("defaults_use_approved_facts_without_numeric_stats", () => {
    const defaults = getAboutDefaults();
    expect(defaults.facts).toHaveLength(4);
    expect(defaults.facts?.[0].value).toBe("3 years, ARIS Vietnam");
    expect(defaults.facts?.[0].value_vi).toBe("3 năm, ARIS Vietnam");
    expect(defaults.stats).toBeUndefined();
  });
  it("fact_fields_preserve_blank_and_unset_per_locale", () => {
    const field = ABOUT_FIELDS.find((item) => item.id === "facts.0.value")!;
    expect(field).toBeDefined();
    const blank = field.setValue(undefined, "vi", "");
    expect(field.getValue(blank, "vi")).toBe("");
    expect(field.getValue(blank, "en")).toBeUndefined();
    expect(field.getValue(field.setValue(blank, "vi", undefined), "vi")).toBeUndefined();
    expect(field.getPlaceholder(getAboutDefaults(), "en")).toBe("3 years, ARIS Vietnam");
  });
});
