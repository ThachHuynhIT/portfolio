import { afterEach, describe, expect, it } from "vitest";
import { compile, evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import {
  MdxPolicyError,
  isSafeUrl,
  mdxPolicyRemarkPlugins,
  remarkRestrictMdx,
  validateMdxSource,
} from "./mdx-policy";


const JSX = /^mdxJsx(Flow|Text)Element$/;

type FlagHolder = { __mdxPolicyPwned?: boolean };
const flags = globalThis as FlagHolder;

afterEach(() => {
  delete flags.__mdxPolicyPwned;
});

/** Runs the real MDX compiler + runtime with the policy, the way render would. */
async function renderWithPolicy(source: string) {
  return evaluate(source, { ...runtime, remarkPlugins: mdxPolicyRemarkPlugins });
}

async function expectRejected(source: string, nodeType?: string | RegExp) {
  await expect(validateMdxSource(source)).rejects.toBeInstanceOf(MdxPolicyError);
  const rendered = renderWithPolicy(source);
  await expect(rendered).rejects.toBeInstanceOf(MdxPolicyError);
  if (nodeType) {
    const error = await validateMdxSource(source).catch((e: unknown) => e);
    expect((error as MdxPolicyError).nodeType).toMatch(nodeType);
  }
  expect(flags.__mdxPolicyPwned).toBeUndefined();
}

describe("mdx policy", () => {
  it("rejects_esm", async () => {
    await expectRejected('import fs from "node:fs"\n\n# Title', "mdxjsEsm");
    await expectRejected("export const x = (globalThis.__mdxPolicyPwned = true)\n\nHello", "mdxjsEsm");
  });

  it("rejects_flow_and_text_expression", async () => {
    await expectRejected("{(globalThis.__mdxPolicyPwned = true)}", "mdxFlowExpression");
    await expectRejected("Hello {(globalThis.__mdxPolicyPwned = true)} world", "mdxTextExpression");
    // Even an empty / comment expression is rejected.
    await expectRejected("Hello {/* comment */} world", "mdxTextExpression");
  });

  it("rejects_all_jsx_including_html_fragment_and_nested_nodes", async () => {
    await expectRejected("<Foo />", JSX);
    await expectRejected('<div className="box">Hi</div>', JSX);
    await expectRejected("<>fragment</>", JSX);
    await expectRejected('Inline <a href="https://example.com">link</a> here', JSX);
    await expectRejected("> Quote with <span>nested</span> text", JSX);
    await expectRejected("- item\n  - nested <em>deep</em>", JSX);
    await expectRejected(
      "<section>\n\n<div onClick={() => (globalThis.__mdxPolicyPwned = true)}>x</div>\n\n</section>",
      JSX
    );
  });

  it("rejects_unsafe_url", async () => {
    await expectRejected("[click](javascript:alert(1))", "link");
    await expectRejected("[click](JaVaScRiPt:alert(1))", "link");
    await expectRejected("[click](javascript&#58;alert(1))", "link");
    await expectRejected("![img](data:text/html;base64,PHNjcmlwdD4=)", "image");
    await expectRejected("[ref]\n\n[ref]: vbscript:msgbox(1)", "definition");

    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("mailto:me@example.com")).toBe(true);
    expect(isSafeUrl("/blog/other")).toBe(true);
    expect(isSafeUrl("#heading")).toBe(true);
    expect(isSafeUrl(" javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("java\nscript:alert(1)")).toBe(false);
  });

  it("accepts_markdown_highlight_and_slug", async () => {
    const source = [
      "## Hello world",
      "",
      "Some **bold** text, `inline code` and a [link](https://example.com).",
      "",
      "```ts",
      "const answer: number = 42;",
      "```",
    ].join("\n");

    await expect(validateMdxSource(source)).resolves.toBeUndefined();
    const output = String(
      await compile(source, { remarkPlugins: mdxPolicyRemarkPlugins, rehypePlugins: [rehypeHighlight, rehypeSlug] })
    );
    expect(output).toContain('"hello-world"');
    expect(output).toContain("hljs");
  });

  it("accepts_jsx_inside_code_fence", async () => {
    const source = [
      "```tsx",
      'import { motion } from "framer-motion";',
      "export function FadeIn() {",
      "  return <motion.div animate={{ opacity: 1 }}>{children}</motion.div>;",
      "}",
      "```",
      "",
      "Inline `<Foo bar={1} />` is fine too.",
    ].join("\n");

    await expect(validateMdxSource(source)).resolves.toBeUndefined();
    const output = String(await compile(source, { remarkPlugins: mdxPolicyRemarkPlugins }));
    expect(output).toContain("framer-motion");
  });

  it("reports parse errors as policy errors with a position and no stack", async () => {
    const error = await validateMdxSource("Hello\n\n<div").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MdxPolicyError);
    expect((error as MdxPolicyError).line).toBe(3);
    expect((error as MdxPolicyError).message).not.toMatch(/\n\s+at /);
  });

  it("refuses a non-empty component allowlist", () => {
    expect(() => remarkRestrictMdx({ allowedComponents: ["Callout"] })).toThrow();
  });
});
