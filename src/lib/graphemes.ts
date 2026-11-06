/** Segmenter is preferred; fallback joins marks, emoji modifiers, ZWJ and flags. */
export function splitGraphemes(text: string, forceFallback = false): string[] {
  if (!forceFallback && typeof Intl.Segmenter === "function") {
    return Array.from(new Intl.Segmenter("vi", { granularity: "grapheme" }).segment(text), (part) => part.segment);
  }
  const result: string[] = [];
  let regionalCount = 0;
  for (const char of Array.from(text)) {
    const code = char.codePointAt(0) ?? 0;
    const regional = code >= 0x1f1e6 && code <= 0x1f1ff;
    const modifier = code >= 0x1f3fb && code <= 0x1f3ff;
    // Explicit combining ranges also work on browsers predating Segmenter,
    // without requiring Unicode property escapes at the project's ES2017 target.
    const mark = /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f\ufe0e\ufe0f\u200d]/u.test(char);
    const previous = result[result.length - 1];
    if (previous && (mark || modifier
      || previous.endsWith("\u200D") || (regional && regionalCount % 2 === 1))) {
      result[result.length - 1] += char;
    } else result.push(char);
    regionalCount = regional ? regionalCount + 1 : 0;
  }
  return result;
}

export function typingStep(length: number): number {
  return Math.min(70, 1600 / Math.max(1, length));
}
