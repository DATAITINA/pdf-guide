# Fieldnote Design System

**Purpose:** A warm, clear digital publisher for practical guides that help with real-life decisions. Preserve Fieldnote's existing identity; do not replace it with generic SaaS or e-commerce styling.

**Source of truth:** `src/styles.css`. If this document and the CSS ever diverge, inspect the live tokens and update this document intentionally.

## Visual direction

- **Character:** Editorial, human, grounded, calm, useful. Think a well-kept field notebook, not a fintech dashboard.
- **Palette:** warm paper, dark ink, and forest green. Use green for primary actions and emphasis; reserve red for errors.
- **Typography:** Fraunces for display headings; Figtree for body, controls, and labels.
- **Layout:** generous whitespace, short readable line lengths, restrained borders, softly rounded surfaces, subtle card shadow. Prefer clear hierarchy over decoration.
- **Imagery:** show actual published guide covers wherever an item is presented as available. If a composite image contains works in progress, label it as a preview and never imply those titles can be purchased.
- **Icons:** use Lucide SVG icons with accessible names/hidden semantics; do not use emoji as interface icons.

## Design tokens

| Token | Value | Use |
|---|---|---|
| `paper` | `#f4f0e8` | Main page background |
| `paper-2` | `#ebe4d6` | Soft contrast surfaces |
| `surface` | `#fffcf7` | Cards, fields, menus |
| `ink` | `#1c1916` | Primary text |
| `muted` | `#5c574f` | Secondary copy |
| `subtle` | `#8a847a` | Low-emphasis labels |
| `line` | `#ddd4c6` | Borders and dividers |
| `accent` | `#1a4d47` | Primary action and brand emphasis |
| `accent-hover` | `#143c38` | Hover state |
| `accent-fg` | `#f4f0e8` | Text on green |
| `danger` | `#8f2d2d` | Errors |
| `ok` | `#215c3a` | Success |

Use the existing CSS variables rather than hard-coding new colors. Radii are 8 / 14 / 22 / 30 px; card shadows stay light and short.

## Interaction and accessibility

- All controls need visible keyboard focus; keep the global 2 px focus-visible outline.
- Make tap targets at least 44 px where practical. Use `aria-pressed` for selectable chips and `aria-expanded`/`aria-controls` for disclosures.
- Keep ordinary navigation semantic; use dialog semantics only for an actual modal with appropriate focus handling.
- Use native input types and constraints, specific error guidance, and announced status feedback. Do not rely on color alone.
- Give submitted actions clear, stable pending text and disable duplicate submissions. Preserve the page's layout while work is in progress.
- Respect `prefers-reduced-motion`; transitions should be subtle (roughly 150–250 ms) and never required to understand the interface.
- Test narrow mobile (375 px), tablet (768 px), and desktop widths; avoid clipped chips and horizontal scrolling.

## Customer trust and publication rules

- Public catalogue, categories, related-guide links, and sitemap contain only **published, unarchived, non-placeholder** products.
- Never show seeded demos, fake testimonials, invented customer counts, or unverified outcomes as customer-facing proof.
- Show only payment methods configured for the current environment. A hosted/production site must never fulfill an unpaid demo checkout.
- If no payment method is available, explain that plainly, do not collect customer details, and give a real support path.
- Distinguish online payment verification from bank-transfer approval; do not promise an instant download before payment is confirmed.
- Keep digital format, price, download timing, voucher terms, refund policy, and support details explicit and consistent across the home, guide, checkout, and FAQ pages.

## Avoid

- Purple/blue SaaS palettes, gradients, glassmorphism, oversized dashboard chrome, and decorative motion that fight the existing brand.
- Empty category links, dead-end search states, fake availability, test-mode language on a public production checkout, and admin-only setup text visible to customers.
