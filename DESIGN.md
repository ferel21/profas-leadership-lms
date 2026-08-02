# PROFAS Leadership — Brand and Interface System

## Direction

A calm, asymmetric learning interface built from bright neutral surfaces, precise borders, PROFAS royal blue, and the green from the PROFAS logo. These rules apply to every current screen and all future development.

- Variance: 8 — split layouts and asymmetric grids keep the product from feeling templated.
- Density: 4 — enough space for executive reading and enough structure for daily LMS work.
- Motion: 6 — short transform/opacity transitions, reduced-motion support, no perpetual visual noise.

## Canonical brand tokens

| Role | Value |
| --- | --- |
| Canvas | `#F4F6F1` |
| Surface | `#FFFFFF` |
| Ink | `#1C2825` |
| Body | `#586761` |
| Line | `#DBE5DF` |
| Royal blue | `#2A6BA7` |
| Royal blue dark | `#1E5A8F` |
| Royal blue deep | `#173F73` |
| Royal blue soft | `#EFF6FF` |
| Logo green | `#33925D` |
| Logo green dark | `#246E48` |
| Logo green soft | `#EAF6EF` |
| Critical red | Semantic error/destructive states only |

Royal blue is the primary color for primary actions, active navigation, progress, focus, and key hierarchy. Logo green is secondary and supports success states, icons, badges, secondary actions, and restrained accents. Critical red is not a brand accent: it is reserved for errors, destructive actions, and urgent validation feedback.

## Typography governance

- San Francisco is the primary and only interface typeface. The canonical stack is `"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`.
- Use `--font-sf` directly or one of its aliases: `--font-body`, `--font-display`, `--font-heading`, `--font-ui`, and `--font-mono`. Every alias resolves to the same stack, including code-like and certificate content.
- Do not import web fonts or introduce display, serif, script, handwritten, or monospace families. Preserve hierarchy through the existing size, weight, line-height, spacing, and layout tokens.
- Apple devices render the installed San Francisco face. Other platforms use their native system sans through the approved stack until licensed SF webfont assets are supplied.

## Rules

- Use royal blue for primary actions, active navigation, progress, focus, and key hierarchy.
- Use logo green only as the secondary brand color for success, supporting actions, icons, badges, and restrained accents.
- Keep neutral colors for surfaces, borders, and text. Do not introduce purple, indigo, violet, pink, cyan, amber, gold, orange, or decorative red.
- Prefer border-top or divider grouping in dense dashboard areas; use cards only when elevation clarifies hierarchy.
- Keep landing page heroes left-aligned and split-screen, with one clear primary CTA.
- Keep all touch targets at least 44px and preserve keyboard focus styles.
- Use local product imagery only; never add fragile external image URLs.
- Avoid neon, purple gradients, pure black, excessive gradient text, and emoji in interface copy.
- Collapse asymmetric grids to one column below 780px and respect `prefers-reduced-motion`.

## Field Notes v2

The public landing page now treats PROFAS activity as proof of practice: the real training collage anchors the hero, while the LMS preview sits as a product layer over it. The narrative continues through three editorial beats — Orientasi, Percakapan, and Penerapan — before closing with measurable outcomes: Clarity, Capability, and Continuity.

The student dashboard follows a Leadership Operating System pattern. The top of the workspace answers three questions immediately: how far the learner has moved, what to do next, and what changed this week. This keeps the visual treatment distinctive while making the interface more operational for daily use.

- Hero imagery is locally hosted in `/public/images` and loaded with explicit dimensions; the activity collage is reused as the primary proof asset.
- Dashboard focus cards use live enrollment, progress, certificate, and course-slug data rather than decorative placeholder metrics.
- Motion stays purposeful: transform/opacity for interaction, linear progress movement, and reduced-motion overrides for every new interactive layer.
