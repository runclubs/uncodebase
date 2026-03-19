---
name: design-system
description: Design system extracted from linear.app. Use this specification for all UI generation.
---

# Design System Specification: linear.app

## 1. Overview & Creative Direction

**Style: Dark / Premium** — Near-black backgrounds with high-contrast off-white text. Minimal chrome, dense information hierarchy, developer-tool aesthetic.

## 2. Colors & Surface Philosophy

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#5e6ad2` | Primary actions, links, active states |
| `--color-secondary` | `#8a8f98` | Secondary text, icons, muted elements |
| `--color-accent` | `#5e6ad2` | Highlights, badges, notifications |
| `--color-background` | `#191a1f` | Page background |
| `--color-surface` | `#1e1f25` | Cards, modals, elevated surfaces |
| `--color-text` | `#f7f8f8` | Primary text |
| `--color-text-muted` | `#8a8f98` | Secondary text, captions |

### Surface Hierarchy

- **Layer 0 (Page):** `#191a1f` — the base canvas
- **Layer 1 (Surface):** `#1e1f25` — cards, panels, elevated containers
- **Layer 2 (Elevated):** `#25262d` — dropdowns, tooltips, raised elements
- **Elevation:** Surfaces use subtle border (`1px solid rgba(255,255,255,0.06)`) rather than heavy shadows
- **Shadow:** `rgba(0, 0, 0, 0.5) 0px 16px 70px`

## 3. Typography

### Font Families

- **Headings:** `Inter Variable` — geometric sans-serif — clean, modern, technical
  - Weights: 400, 510
- **Body:** `Inter Variable` — geometric sans-serif — clean, modern, technical
  - Weights: 400, 510
- **Mono:** `monospace` — For code blocks, data tables, system text

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing | Usage |
|---------|------|--------|-------------|----------------|-------|
| H1 | 56px | 400 | 1.1 | -1.4px | Hero headlines, page titles |
| H2 | 40px | 510 | 1.1 | -0.8px | Section headers |
| H3 | 20px | 510 | 1.33 | -0.24px | Card titles, subsections |
| H4 | 16px | 510 | 1.5 | 0 | Small headings |
| Body | 16px | 400 | 1.6 | -0.1px | Paragraphs, default text |
| Small | 13px | 400 | 1.5 | 0 | Captions, metadata |

## 4. Spacing & Layout

### Base Unit
**4px** — all spacing derives from this value

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Hairline gaps, tight inline spacing |
| `--space-2` | 8px | Icon gaps, compact padding |
| `--space-3` | 12px | Input padding, button padding |
| `--space-4` | 16px | Card padding, form gaps |
| `--space-6` | 24px | Section padding (small) |
| `--space-8` | 32px | Section gaps, large padding |
| `--space-10` | 40px | Major section spacing |
| `--space-12` | 48px | Page-level spacing |
| `--space-16` | 64px | Hero spacing, major breaks |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Buttons, inputs, badges |
| `--radius-md` | 8px | Cards, dropdowns |
| `--radius-lg` | 12px | Modals, large containers |
| `--radius-full` | 9999px | Avatars, pills |

> This design uses **subtle, sharp rounding** (4-8px). Keep corners crisp.

### Shadows

| Shadow | Usage |
|--------|-------|
| `rgba(0, 0, 0, 0.5) 0px 16px 70px` | Modal/dropdown elevation |
| `rgba(0, 0, 0, 0.3) 0px 2px 8px` | Card hover state |

---

## 5. Component Architecture (Atomic Design)

Build UI by composing small, reusable pieces. Never write raw HTML with inline styles — always compose from atoms up.

### Atoms
Single-purpose, stateless building blocks. Each consumes design tokens via CSS variables.

| Component | Props | Notes |
|-----------|-------|-------|
| `Button` | variant (primary / secondary / ghost), size (sm / md / lg), disabled | Solid fill or outline per variant |
| `Input` | type (text / search / email), error, disabled | Bordered, focus ring |
| `Badge` | variant (default / accent / muted) | Pill shape, small text |
| `Typography` | as (h1–h4 / p / span / caption), weight | Maps to type scale |
| `Icon` | name, size (sm / md / lg), color | Wraps SVG icons |
| `Swatch` | color, label | Color preview circle + label |
| `Divider` | orientation (horizontal / vertical) | 1px border-color line |

### Molecules
Combinations of 2–4 atoms that form a distinct UI pattern.

| Component | Composed of | Notes |
|-----------|-------------|-------|
| `SearchBar` | Input + Button | Input with attached action button |
| `Card` | Surface + Typography + optional Button | Elevated container with content |
| `NavItem` | Icon + Typography | Navigation link with icon |
| `FormField` | Typography (label) + Input + Typography (error) | Label, input, validation message |
| `Tag` | Badge + Icon (optional close) | Removable pill |
| `Stat` | Typography (value) + Typography (label) | Metric display |

### Organisms
Page-level sections composed of molecules and atoms.

| Component | Composed of | Notes |
|-----------|-------------|-------|
| `Header` | Logo + NavItem[] + Button (CTA) | Sticky top bar |
| `Hero` | Typography (h1 + p) + SearchBar or Button | Above-the-fold section |
| `CardGrid` | Card[] | Responsive grid of cards |
| `Footer` | NavItem[] + Typography + Icon[] (social) | Page bottom |
| `Section` | Typography (heading) + any children | Generic page section wrapper |

### Rules
- Each component gets its own file
- Components consume design tokens via CSS variables — never hardcode hex values
- Atoms are stateless; state lives in organisms or page-level components
- Compose upward: atoms → molecules → organisms → pages

## 6. Component Specs

### Buttons

- **Primary:** White fill (`#ffffff`), dark text (`#000000`)
- **Secondary:** Transparent with border `1px solid rgba(255,255,255,0.1)`, light text
- **Ghost:** No border, `var(--color-text-muted)` text
- **Radius:** 4px (var(--radius-sm))
- **Padding:** var(--space-2) var(--space-3)
- **Font weight:** 510
- **Font size:** 13px
- **States:** hover (lighten bg 5%), active (scale 0.98), disabled (opacity 0.5)

### Input Fields

- **Style:** Dark input with `var(--color-surface)` background
- **Border:** 1px solid rgba(255,255,255,0.1)
- **Radius:** 8px
- **Padding:** var(--space-2) var(--space-3)
- **Focus:** 2px ring with var(--color-primary)
- **Error:** Border color changes to red/destructive

### Cards

- **Background:** var(--color-surface)
- **Radius:** 8px (var(--radius-md))
- **Padding:** var(--space-4) or var(--space-6)
- **Border:** 1px solid rgba(255,255,255,0.06)

## 7. Interactions & Micro-animations

### Transition Patterns

| Property | Duration | Timing | Frequency |
|----------|----------|--------|-----------|
| color | 0.1s | cubic-bezier(0.25, 0.46, 0.45, 0.94) | common |
| background | 0.1s | cubic-bezier(0.25, 0.46, 0.45, 0.94) | common |
| transform | 0.16s | cubic-bezier(0.25, 0.46, 0.45, 0.94) | common |
| box-shadow | 0.16s | cubic-bezier(0.25, 0.46, 0.45, 0.94) | hover |
| border | 0.16s | cubic-bezier(0.25, 0.46, 0.45, 0.94) | focus |

> Transitions are **snappy** (100-160ms) — interactions feel instant. Use cubic-bezier(0.25, 0.46, 0.45, 0.94) consistently.

### Interaction Rules

- **Hover:** Use the transition durations above. Prefer `opacity`, `background-color`, or `box-shadow` transitions over `transform` for subtlety.
- **Active:** `scale(0.98)` for tactile press feedback.
- **Focus:** 2px ring with `var(--color-primary)` for accessibility.
- **Disabled:** `opacity: 0.5`, `pointer-events: none`.

---

## 8. Rules for AI Generation

### Do:
- Use **exact color values** from this spec — never Tailwind defaults
- Use `Inter Variable` for all headings and body text
- Follow the **4px spacing scale** strictly
- Match border radius to the defined scale (4-8px, sharp)
- Use `rgba(255,255,255,0.06)` borders on dark surfaces instead of heavy shadows
- Match the **snappy transition timing** (0.1-0.16s cubic-bezier)
- Use white primary buttons with dark text, like Linear

### Don't:
- Never use Roboto, Arial, Helvetica unless specified above
- Never use Tailwind default colors (`#3B82F6`, `#EF4444`, etc.)
- Never use arbitrary spacing values outside the scale
- Never use large border-radius values (>12px) — keep it sharp
- Never use light backgrounds — this is a dark theme
- Never override these tokens with framework defaults

---

*Extracted from [linear.app](https://linear.app) by [Uncodebase](https://uncodebase.com)*
