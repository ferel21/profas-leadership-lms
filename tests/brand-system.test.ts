import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();
const runtimeRoots = ["app", "components", "styles"];
const runtimeExtensions = new Set([".css", ".js", ".jsx", ".ts", ".tsx"]);

type SourceFile = {
  relativePath: string;
  source: string;
};

function collectSourceFiles(relativeDirectory: string): SourceFile[] {
  const absoluteDirectory = path.join(projectRoot, relativeDirectory);

  return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(relativePath);
    }

    if (!entry.isFile() || !runtimeExtensions.has(path.extname(entry.name))) {
      return [];
    }

    return [{
      relativePath,
      source: readFileSync(path.join(projectRoot, relativePath), "utf8"),
    }];
  });
}

function findPolicyViolations(
  files: SourceFile[],
  policies: ReadonlyArray<{ label: string; pattern: RegExp }>,
): string[] {
  const violations: string[] = [];

  for (const file of files) {
    const lines = file.source.split(/\r?\n/);

    lines.forEach((line, lineIndex) => {
      for (const policy of policies) {
        policy.pattern.lastIndex = 0;
        if (policy.pattern.test(line)) {
          violations.push(`${file.relativePath}:${lineIndex + 1} (${policy.label}) ${line.trim()}`);
        }
      }
    });
  }

  return violations;
}

test("San Francisco is the single typography source for CSS, Tailwind, and the root layout", () => {
  const typography = readFileSync(path.join(projectRoot, "styles/typography.css"), "utf8");
  const tailwind = readFileSync(path.join(projectRoot, "tailwind.config.js"), "utf8");
  const layout = readFileSync(path.join(projectRoot, "app/layout.tsx"), "utf8");

  assert.match(
    typography,
    /--font-sf:\s*"SF Pro Text",\s*"SF Pro Display",\s*-apple-system,\s*BlinkMacSystemFont,\s*sans-serif;/,
  );

  for (const alias of ["body", "display", "heading", "ui", "mono"]) {
    assert.match(typography, new RegExp(`--font-${alias}:\\s*var\\(--font-sf\\);`));
    assert.match(
      tailwind,
      new RegExp(`\\b${alias === "ui" ? "sans" : alias}:\\s*\\[\\s*['\"]var\\(--font-sf\\)['\"]\\s*\\]`),
    );
  }

  assert.doesNotMatch(layout, /next\/font\/google/);
  assert.match(layout, /<body className="font-sans">/);
});

test("runtime source contains no legacy font or purple/indigo styling", () => {
  const runtimeFiles = runtimeRoots.flatMap(collectSourceFiles).concat({
    relativePath: "tailwind.config.js",
    source: readFileSync(path.join(projectRoot, "tailwind.config.js"), "utf8"),
  });
  const bannedPurpleHexes = [
    "faf5ff", "f3e8ff", "e9d5ff", "d8b4fe", "c084fc", "a855f7", "9333ea", "7e22ce", "6b21a8", "581c87", "3b0764",
    "eef2ff", "e0e7ff", "c7d2fe", "a5b4fc", "818cf8", "6366f1", "4f46e5", "4338ca", "3730a3", "312e81", "1e1b4b",
    "f5f3ff", "ede9fe", "ddd6fe", "c4b5fd", "a78bfa", "8b5cf6", "7c3aed", "6d28d9", "5b21b6", "4c1d95", "2e1065",
    "f1eafa", "8b59c7",
  ].join("|");
  const violations = findPolicyViolations(runtimeFiles, [
    { label: "remote Google font import", pattern: /next\/font\/google/i },
    { label: "legacy font variable", pattern: /--font-(?:inter|fraunces|space)\b/i },
    { label: "legacy named font", pattern: /\b(?:Inter|Fraunces|Space_Grotesk|Space Grotesk|Georgia|Roboto|Helvetica|Arial|Segoe UI|Times New Roman|ui-monospace|SFMono-Regular|Menlo|cursive|monospace)\b/i },
    { label: "generic serif family", pattern: /(?<!sans-)\bserif\b/i },
    { label: "purple/indigo name or utility", pattern: /\b(?:purple|indigo|violet)(?:-\d{2,3})?\b/i },
    { label: "purple/indigo hex literal", pattern: new RegExp(`#(?:${bannedPurpleHexes})\\b`, "i") },
    { label: "purple/indigo rgb literal", pattern: /rgba?\(\s*(?:139\s*,\s*92\s*,\s*246|109\s*,\s*40\s*,\s*217|99\s*,\s*102\s*,\s*241|79\s*,\s*70\s*,\s*229|124\s*,\s*58\s*,\s*237|126\s*,\s*34\s*,\s*206)\b/i },
  ]);

  assert.deepEqual(violations, [], violations.join("\n"));
});

test("canonical PROFAS color tokens and governance are documented", () => {
  const brandCss = readFileSync(path.join(projectRoot, "styles/profas-reframe.css"), "utf8");
  const design = readFileSync(path.join(projectRoot, "DESIGN.md"), "utf8");
  const canonicalTokens = [
    ["primary", "2a6ba7"],
    ["primary-dark", "1e5a8f"],
    ["deep", "173f73"],
    ["primary-soft", "eff6ff"],
    ["secondary", "33925d"],
    ["secondary-dark", "246e48"],
    ["secondary-soft", "eaf6ef"],
  ] as const;

  for (const [token, value] of canonicalTokens) {
    assert.match(brandCss, new RegExp(`--pf-${token}:\\s*#${value};`, "i"));
    assert.match(design, new RegExp(`#${value}\\b`, "i"));
  }

  assert.match(design, /Critical red/i);
  assert.match(design, /errors?, destructive actions?/i);
  assert.match(design, /all future development/i);
});
