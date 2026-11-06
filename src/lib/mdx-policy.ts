import { createProcessor } from "@mdx-js/mdx";

/**
 * MDX policy for CMS blog bodies (EN and VI).
 *
 * Blog posts are stored in Postgres and compiled to JavaScript on the server,
 * so anything that MDX would evaluate is rejected *before* compilation:
 * ESM (`import`/`export`), flow/text expressions (`{...}`) and every JSX
 * element — components, HTML-looking tags and fragments alike (the component
 * allowlist is intentionally empty). Links, images and definitions must use a
 * safe URL scheme. Code fences and inline code are plain text in the AST and
 * are therefore unaffected.
 *
 * This module must stay free of DB imports.
 */

const BLOCKED_NODE_TYPES: ReadonlyMap<string, string> = new Map([
  ["mdxjsEsm", "import/export statements are not allowed"],
  ["mdxFlowExpression", "{expressions} are not allowed"],
  ["mdxTextExpression", "{expressions} are not allowed"],
  ["mdxJsxFlowElement", "JSX/HTML elements are not allowed"],
  ["mdxJsxTextElement", "JSX/HTML elements are not allowed"],
  // Not produced by the MDX parser today, but never let raw HTML through.
  ["html", "raw HTML is not allowed"],
]);

const URL_NODE_TYPES = new Set(["link", "image", "definition"]);
const SAFE_URL_SCHEMES = new Set(["http", "https", "mailto", "tel"]);

interface PositionPoint {
  line?: number;
  column?: number;
}

interface PolicyNode {
  type: string;
  url?: unknown;
  children?: unknown;
  position?: { start?: PositionPoint };
}

export class MdxPolicyError extends Error {
  readonly nodeType: string;
  readonly line?: number;
  readonly column?: number;

  constructor(nodeType: string, reason: string, point?: PositionPoint) {
    const where = point?.line ? ` at line ${point.line}, column ${point.column ?? 1}` : "";
    super(`MDX not allowed${where}: ${reason}`);
    this.name = "MdxPolicyError";
    this.nodeType = nodeType;
    this.line = point?.line;
    this.column = point?.column;
  }
}

export interface RemarkRestrictMdxOptions {
  /** Must be empty: no JSX component is allowed in CMS content. */
  allowedComponents: readonly string[];
}

/** True for relative URLs/anchors and for http(s), mailto and tel. */
export function isSafeUrl(url: string): boolean {
  // Browsers ignore ASCII whitespace/control chars inside a scheme ("java\nscript:").
  // eslint-disable-next-line no-control-regex
  const normalized = url.replace(/[\u0000- \u007f-\u009f]/g, "").toLowerCase();
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(normalized);
  if (!scheme) return true;
  return SAFE_URL_SCHEMES.has(scheme[1]);
}

function isPolicyNode(value: unknown): value is PolicyNode {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

/** Walks the mdast tree (iteratively) and throws on the first forbidden node. */
export function assertMdxTreeAllowed(tree: unknown): void {
  const stack: unknown[] = [tree];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!isPolicyNode(node)) continue;

    const blockedReason = BLOCKED_NODE_TYPES.get(node.type);
    if (blockedReason) {
      throw new MdxPolicyError(node.type, blockedReason, node.position?.start);
    }
    if (URL_NODE_TYPES.has(node.type) && typeof node.url === "string" && !isSafeUrl(node.url)) {
      throw new MdxPolicyError(node.type, "unsafe URL scheme", node.position?.start);
    }
    if (Array.isArray(node.children)) {
      for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i]);
    }
  }
}

/** Remark plugin enforcing the policy inside any MDX compile (MDXRemote, serialize, compile). */
export function remarkRestrictMdx(options: RemarkRestrictMdxOptions = { allowedComponents: [] }) {
  if (options.allowedComponents.length > 0) {
    throw new Error("remarkRestrictMdx: the JSX component allowlist must be empty");
  }
  return (tree: unknown): void => {
    assertMdxTreeAllowed(tree);
  };
}

/** Ready-to-use `remarkPlugins` entry. */
export const mdxPolicyRemarkPlugins = [[remarkRestrictMdx, { allowedComponents: [] }]] as [
  typeof remarkRestrictMdx,
  RemarkRestrictMdxOptions,
][];

function parseErrorPoint(error: unknown): PositionPoint | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const { line, column } = error as { line?: unknown; column?: unknown };
  return typeof line === "number" ? { line, column: typeof column === "number" ? column : undefined } : undefined;
}

function parseErrorReason(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const { reason } = error as { reason?: unknown };
    if (typeof reason === "string" && reason) return reason;
  }
  return "the content could not be parsed as MDX";
}

/**
 * Parses `source` with the same MDX parser the compiler uses and applies the
 * policy. Resolves when allowed; otherwise rejects with an `MdxPolicyError`
 * (parse errors included) whose message carries a line/column but no stack.
 */
export async function validateMdxSource(source: string): Promise<void> {
  let tree: unknown;
  try {
    tree = createProcessor({ format: "mdx" }).parse(source);
  } catch (error) {
    throw new MdxPolicyError("parse", parseErrorReason(error), parseErrorPoint(error));
  }
  assertMdxTreeAllowed(tree);
}
