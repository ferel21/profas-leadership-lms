// Next.js handles global CSS imports at build time. This ambient declaration
// lets TypeScript validate side-effect-only stylesheet imports without
// reporting the CSS files as missing modules.
declare module "*.css" {}
