/**
 * Builds the animated "engineer" code snippet shown in the hero section.
 *
 * The snippet is a list of plain-text tokens with an optional colour, which
 * React renders as <span>s. No HTML strings are produced, so nothing here can
 * turn into injected markup even if profile data changes.
 */

export interface CodeToken {
  text: string;
  color?: string;
}

/** VS Code "Dark+" inspired palette. */
export const codeColors = {
  comment: "#6A9955",
  keyword: "#569CD6",
  string: "#CE9178",
  property: "#9CDCFE",
  param: "#4FC1FF",
  fn: "#4EC9B0",
} as const;

const t = (text: string, color?: string): CodeToken => ({ text, color });

export function stringArrayTokens(values: readonly string[]): CodeToken[] {
  const tokens: CodeToken[] = [t("[")];
  values.forEach((value, index) => {
    tokens.push(t(`'${value}'`, codeColors.string));
    if (index < values.length - 1) tokens.push(t(", "));
  });
  tokens.push(t("]"));
  return tokens;
}

export interface SnippetInput {
  name: string;
  role: string;
  stack: Record<string, readonly string[]>;
}

export function buildEngineerSnippet({ name, role, stack }: SnippetInput): CodeToken[] {
  const tokens: CodeToken[] = [
    t("// Every change: tested, scanned, traceable", codeColors.comment),
    t("\n"),
    t("const", codeColors.keyword),
    t(" engineer = {\n"),
    t("  "),
    t("name", codeColors.property),
    t(": "),
    t(`'${name}'`, codeColors.string),
    t(",\n  "),
    t("role", codeColors.property),
    t(": "),
    t(`'${role}'`, codeColors.string),
    t(",\n  "),
    t("stack", codeColors.property),
    t(": {\n"),
  ];

  const groups = Object.entries(stack);
  groups.forEach(([group, values], index) => {
    tokens.push(t("    "), t(group, codeColors.property), t(": "));
    tokens.push(...stringArrayTokens(values));
    tokens.push(t(index < groups.length - 1 ? ",\n" : "\n"));
  });

  tokens.push(
    t("  },\n  "),
    t("ship", codeColors.property),
    t(": ("),
    t("change", codeColors.param),
    t(") "),
    t("=>", codeColors.keyword),
    t("\n    "),
    t("test", codeColors.fn),
    t("(change) && "),
    t("scan", codeColors.fn),
    t("(change) && "),
    t("deploy", codeColors.fn),
    t("(change)\n};")
  );

  return tokens;
}

export function tokensLength(tokens: readonly CodeToken[]): number {
  return tokens.reduce((sum, token) => sum + token.text.length, 0);
}

/** Returns the tokens needed to show only the first `chars` characters. */
export function sliceTokens(tokens: readonly CodeToken[], chars: number): CodeToken[] {
  const result: CodeToken[] = [];
  let remaining = Math.max(0, chars);

  for (const token of tokens) {
    if (remaining <= 0) break;
    if (token.text.length <= remaining) {
      result.push(token);
      remaining -= token.text.length;
    } else {
      result.push({ ...token, text: token.text.slice(0, remaining) });
      remaining = 0;
    }
  }
  return result;
}
