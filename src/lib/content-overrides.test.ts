import { describe, expect, it } from "vitest";
import {
  pickLocalized,
  resolveRequiredText,
  resolveSectionText,
  resolveStatValue,
  translateBlogCategory,
  translateReadTime,
} from "@/lib/content-overrides";

describe("content-overrides", () => {
  it("unset_uses_locale_default", () => {
    expect(resolveSectionText("en", undefined, undefined, "Default EN")).toBe("Default EN");
    expect(resolveSectionText("vi", null, null, "Mặc định")).toBe("Mặc định");
    expect(resolveStatValue("en", undefined, "3+")).toBe("3+");
    expect(resolveStatValue("en", {}, "3+")).toBe("3+");
  });

  it("blank_hides_optional", () => {
    expect(resolveSectionText("en", "", undefined, "Default")).toBe("");
    expect(resolveSectionText("en", "   ", undefined, "Default")).toBe("");
    expect(resolveSectionText("vi", undefined, "", "Mặc định")).toBe("");
    expect(resolveStatValue("vi", { value: "5", value_vi: " " }, "3+")).toBe("");
    expect(resolveSectionText("en", "Custom", undefined, "Default")).toBe("Custom");
  });

  it("blank_required_uses_default", () => {
    expect(resolveRequiredText("en", "", undefined, "Send")).toBe("Send");
    expect(resolveRequiredText("en", "  ", undefined, "Send")).toBe("Send");
    expect(resolveRequiredText("vi", undefined, "", "Gửi")).toBe("Gửi");
    expect(resolveRequiredText("en", "Submit", undefined, "Send")).toBe("Submit");
  });

  it("vi_section_does_not_leak_en_override", () => {
    expect(resolveSectionText("vi", "English override", undefined, "Mặc định VI")).toBe("Mặc định VI");
    expect(resolveSectionText("en", undefined, "Ghi đè VI", "Default EN")).toBe("Default EN");
    expect(resolveStatValue("vi", { value: "10" }, "3+")).toBe("3+");
  });

  it("site_field_vi_blank_falls_back_en", () => {
    expect(pickLocalized("vi", "Title EN", "")).toBe("Title EN");
    expect(pickLocalized("vi", "Title EN", "  ")).toBe("Title EN");
    expect(pickLocalized("vi", "Title EN", undefined)).toBe("Title EN");
    expect(pickLocalized("vi", "Title EN", "Tiêu đề")).toBe("Tiêu đề");
    expect(pickLocalized("en", "Title EN", "Tiêu đề")).toBe("Title EN");
    expect(pickLocalized("en", "  ", "Tiêu đề")).toBe("");
    expect(pickLocalized("vi", null, null)).toBe("");
  });

  it("unknown_category_and_read_time_preserved", () => {
    expect(translateBlogCategory("Tutorial", "vi")).toBe("Hướng dẫn");
    expect(translateBlogCategory(" Case Study ", "vi")).toBe("Nghiên cứu tình huống");
    expect(translateBlogCategory("Quantum Basket Weaving", "vi")).toBe("Quantum Basket Weaving");
    expect(translateBlogCategory("Tutorial", "en")).toBe("Tutorial");

    expect(translateReadTime("5 min read", "vi", "phút đọc")).toBe("5 phút đọc");
    expect(translateReadTime("quick read", "vi", "phút đọc")).toBe("quick read");
    expect(translateReadTime("5 min read", "en", "phút đọc")).toBe("5 min read");
  });
});
