import { describe, expect, it } from "vitest";

import {
  buildEngineerSnippet,
  codeColors,
  sliceTokens,
  stringArrayTokens,
  tokensLength,
} from "@/lib/code-snippet";

const input = {
  name: "Wisnu",
  role: "Cloud Automation & Release Engineer",
  stack: { cloud: ["AWS", "GCP"], containers: ["Docker"] },
};

const text = (tokens: { text: string }[]) => tokens.map((t) => t.text).join("");

describe("buildEngineerSnippet", () => {
  it("renders name, role and every stack group as plain text (positive)", () => {
    const code = text(buildEngineerSnippet(input));

    expect(code).toContain("name: 'Wisnu'");
    expect(code).toContain("role: 'Cloud Automation & Release Engineer'");
    expect(code).toContain("cloud: ['AWS', 'GCP'],");
    expect(code).toContain("containers: ['Docker']\n");
  });

  it("keeps markup-looking input as literal text, never HTML (negative)", () => {
    const tokens = buildEngineerSnippet({ ...input, name: "<img src=x onerror=alert(1)>" });
    const nameToken = tokens.find((t) => t.text.includes("<img"));

    expect(nameToken?.text).toBe("'<img src=x onerror=alert(1)>'");
    expect(nameToken?.color).toBe(codeColors.string);
  });

  it("handles an empty stack group (edge case)", () => {
    expect(stringArrayTokens([]).map((t) => t.text).join("")).toBe("[]");
    expect(text(buildEngineerSnippet({ ...input, stack: { iac: [] } }))).toContain("iac: []");
  });
});

describe("sliceTokens", () => {
  const tokens = [
    { text: "const", color: codeColors.keyword },
    { text: " x = " },
    { text: "'y'", color: codeColors.string },
  ];

  it("cuts in the middle of a token and keeps its colour (positive)", () => {
    const sliced = sliceTokens(tokens, 7);
    expect(text(sliced)).toBe("const x");
    expect(sliced[0].color).toBe(codeColors.keyword);
  });

  it("returns nothing for zero or negative lengths (edge case)", () => {
    expect(sliceTokens(tokens, 0)).toEqual([]);
    expect(sliceTokens(tokens, -5)).toEqual([]);
  });

  it("returns everything when asked for more than the total (edge case)", () => {
    expect(sliceTokens(tokens, 999)).toEqual(tokens);
    expect(tokensLength(tokens)).toBe(13);
  });
});
