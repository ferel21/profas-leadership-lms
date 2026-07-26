import { createTheme, type MantineColorsTuple } from "@mantine/core";

/**
 * Mantine mapped onto the existing PROFAS palette.
 *
 * The palette is the one fixed constraint on this product, so Mantine is
 * configured to speak it rather than the other way round. Mantine expects a
 * 10-shade tuple per colour; index 6 is what it uses for filled surfaces, so
 * the brand royal blue sits there and the darker brand tone at 7-8.
 */

// Royal blue — --al-primary #2a6ba7 at index 6, --al-primary-dark #1e5a8f at 7.
const profasBlue: MantineColorsTuple = [
  "#eff6ff", // 0  — --al-primary-light
  "#dbeafe", // 1
  "#bfdbfe", // 2
  "#93c0e4", // 3
  "#6ba3d2", // 4
  "#4785bd", // 5
  "#2a6ba7", // 6  — --al-primary (brand)
  "#1e5a8f", // 7  — --al-primary-dark
  "#174874", // 8
  "#0f3559", // 9
];

/**
 * Gold — --al-accent #f3b444.
 *
 * HARD RULE, encoded here rather than left to memory: gold is 1.84:1 on white,
 * so it must never carry text on a light surface. It is only safe as a
 * BACKGROUND under --al-ink text (9.99:1). Mantine reads index 6 for filled
 * backgrounds, which is the intended use; any Gold-coloured *text* would fail
 * WCAG and should not be used.
 */
const profasGold: MantineColorsTuple = [
  "#fffbeb",
  "#fef9c3", // --al-accent-light
  "#fdeeb0",
  "#fbe08a",
  "#f8cf65",
  "#f5c052",
  "#f3b444", // 6 — --al-accent (background only)
  "#d9971f",
  "#b07a17",
  "#875d11",
];

export const profasTheme = createTheme({
  primaryColor: "profasBlue",
  primaryShade: { light: 6, dark: 4 },
  colors: { profasBlue, profasGold },

  // Inherit the app's existing font stack rather than introducing Mantine's.
  fontFamily: 'var(--font-inter, "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
  headings: {
    fontFamily: 'var(--font-fraunces, var(--font-inter, "Inter", serif))',
  },

  defaultRadius: "md",

  /**
   * Match the focus ring shipped in PR #28: a solid 2px --al-primary outline
   * with a white inner ring, which measures 5.59:1 and stays visible on dark
   * and blue surfaces. Mantine's default ring would otherwise diverge from the
   * rest of the product.
   */
  focusRing: "auto",
  other: {
    focusOutline: "2px solid #2a6ba7",
    focusOutlineOffset: "2px",
    focusHalo: "0 0 0 2px #ffffff",
  },
});
