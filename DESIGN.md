# PROFAS Leadership — Tidal Editorial Design System

## Direction

A calm, asymmetric learning interface inspired by a well-lit architecture studio: warm off-white surfaces, charcoal ink, one measured teal accent, precise borders, and motion that feels tactile rather than theatrical.

- Variance: 8 — split layouts and asymmetric grids keep the product from feeling templated.
- Density: 4 — enough space for executive reading and enough structure for daily LMS work.
- Motion: 6 — short transform/opacity transitions, reduced-motion support, no perpetual visual noise.

## Tokens

| Role | Value |
| --- | --- |
| Canvas | `#F4F6F1` |
| Surface | `#FFFFFF` |
| Ink | `#1C2825` |
| Body | `#586761` |
| Line | `#DBE5DF` |
| Accent | `#0F766E` |
| Deep surface | `#173C37` |

## Rules

- Use the teal accent for actions, active navigation, progress, and focus only.
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
