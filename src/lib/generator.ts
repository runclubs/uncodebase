import type { ScrapedTokens } from "./scrape-types";

function v(token: { value: string } | null, fallback: string): string {
  return token?.value ?? fallback;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

// ── Creative direction inference ──

function inferCreativeDirection(tokens: ScrapedTokens): string {
  const lines: string[] = [];
  const bg = tokens.colors.background?.value ?? "#ffffff";
  const primary = tokens.colors.primary?.value;
  const radius = tokens.radius.dominant;
  const headingFont = tokens.typography.headingFont?.family ?? "";
  const bodyFont = tokens.typography.bodyFont?.family ?? "";
  const hasShadows = tokens.shadows.length > 0;

  // Detect overall vibe
  const isDark = bg.toLowerCase() !== "#ffffff" && bg.toLowerCase() !== "#fafafa" && bg.toLowerCase() !== "#f9fafb";
  const isSharp = radius !== null && radius <= 2;
  const isRounded = radius !== null && radius >= 12;
  const hasSerif = /serif|georgia|times|playfair|lora|merriweather/i.test(headingFont + bodyFont);
  const isGeometric = /grotesk|inter|dm sans|space|geist|manrope|outfit/i.test(headingFont + bodyFont);
  const isMono = /mono|code|fira|jetbrains|source code/i.test(headingFont);

  if (isMono || isSharp) {
    lines.push("**Style: Technical / Brutalist** — Sharp edges, monospace influences, developer-oriented aesthetic.");
  } else if (hasSerif && !isGeometric) {
    lines.push("**Style: Editorial / Premium** — Serif typography signals heritage, trust, and editorial sophistication.");
  } else if (isRounded && hasShadows) {
    lines.push("**Style: Soft / Friendly** — Generous border radius and soft shadows create an approachable, consumer-friendly feel.");
  } else if (isDark) {
    lines.push("**Style: Dark / Premium** — Dark backgrounds with high-contrast text project a modern, premium aesthetic.");
  } else if (isGeometric) {
    lines.push("**Style: Modern / Minimal** — Clean geometric sans-serif typography with intentional whitespace.");
  } else {
    lines.push("**Style: Clean / Corporate** — Professional, balanced design with neutral foundations.");
  }

  // Color personality
  if (primary) {
    const r = parseInt(primary.slice(1, 3), 16);
    const g = parseInt(primary.slice(3, 5), 16);
    const b = parseInt(primary.slice(5, 7), 16);
    if (b > r && b > g) lines.push("- Primary color is blue-family: conveys trust, technology, reliability.");
    else if (r > g && r > b && g < 100) lines.push("- Primary color is red-family: conveys energy, urgency, passion.");
    else if (g > r && g > b) lines.push("- Primary color is green-family: conveys growth, health, sustainability.");
    else if (r > 200 && g > 100 && b < 100) lines.push("- Primary color is orange/amber: conveys warmth, creativity, optimism.");
    else if (r > 80 && b > 80 && g < 100) lines.push("- Primary color is purple-family: conveys creativity, premium, innovation.");
  }

  // Spacing philosophy
  const base = tokens.spacing.baseUnit;
  if (base && base >= 8) {
    lines.push("- Generous spacing (8px+ base) creates a breathable, luxurious layout.");
  } else if (base && base <= 4) {
    lines.push("- Tight spacing (4px base) creates a dense, information-rich layout.");
  }

  return lines.join("\n");
}

// ── Surface hierarchy inference ──

function inferSurfaceHierarchy(tokens: ScrapedTokens): string {
  const bg = v(tokens.colors.background, "#ffffff");
  const surface = v(tokens.colors.surface, "#f9fafb");
  const hasShadows = tokens.shadows.length > 0;

  const lines: string[] = [];
  lines.push(`- **Layer 0 (Page):** \`${bg}\` — the base canvas`);
  lines.push(`- **Layer 1 (Surface):** \`${surface}\` — cards, panels, elevated containers`);

  if (hasShadows) {
    lines.push("- **Elevation:** Surfaces are lifted using box-shadow rather than borders");
    lines.push(`- **Shadow:** \`${tokens.shadows[0].value}\``);
  } else {
    lines.push("- **Elevation:** Surfaces use subtle background color shifts or borders (no heavy shadows)");
  }

  return lines.join("\n");
}

// ── Component inference ──

function inferButtonStyle(tokens: ScrapedTokens): string {
  const radius = tokens.radius.medium ?? tokens.radius.dominant ?? 8;
  const hasShadows = tokens.shadows.length > 0;
  const lines: string[] = [];

  lines.push(`- **Primary:** Solid fill with \`var(--color-primary)\`, white text`);
  lines.push(`- **Secondary:** Outline or ghost style, \`var(--color-secondary)\` border`);
  lines.push(`- **Radius:** ${radius}px (var(--radius-sm))`);
  lines.push("- **Padding:** var(--space-2) var(--space-4)");
  lines.push("- **Font weight:** 500");
  if (hasShadows) {
    lines.push("- **Shadow:** Subtle elevation on hover");
  }
  lines.push("- **States:** hover (darken 10%), active (scale 0.98), disabled (opacity 0.5)");

  return lines.join("\n");
}

function inferInputStyle(tokens: ScrapedTokens): string {
  const radius = tokens.radius.medium ?? tokens.radius.dominant ?? 8;
  const lines: string[] = [];

  lines.push(`- **Style:** Bordered input with \`var(--color-surface)\` background`);
  lines.push(`- **Border:** 1px solid var(--color-secondary)`);
  lines.push(`- **Radius:** ${radius}px`);
  lines.push("- **Padding:** var(--space-2) var(--space-3)");
  lines.push("- **Focus:** 2px ring with var(--color-primary)");
  lines.push("- **Error:** Border color changes to red/destructive");

  return lines.join("\n");
}

function inferCardStyle(tokens: ScrapedTokens): string {
  const radius = tokens.radius.large ?? tokens.radius.dominant ?? 12;
  const hasShadows = tokens.shadows.length > 0;
  const lines: string[] = [];

  lines.push(`- **Background:** var(--color-surface)`);
  lines.push(`- **Radius:** ${radius}px (var(--radius-lg))`);
  lines.push("- **Padding:** var(--space-4) or var(--space-6)");
  if (hasShadows) {
    lines.push(`- **Shadow:** \`${tokens.shadows[0].value}\``);
  } else {
    lines.push("- **Border:** 1px solid var(--color-secondary) (no shadow)");
  }

  return lines.join("\n");
}

// ═══════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════

export function generateDesignMd(tokens: ScrapedTokens, url: string): string {
  const domain = getDomain(url);
  const base = tokens.spacing.baseUnit ?? 4;
  const headingFont = tokens.typography.headingFont?.family ?? "system-ui";
  const bodyFont = tokens.typography.bodyFont?.family ?? "system-ui";
  const headingWeights = tokens.typography.headingFont?.weights ?? [];
  const bodyWeights = tokens.typography.bodyFont?.weights ?? [];

  const L: string[] = [];

  // ── FRONTMATTER ──
  L.push("---");
  L.push("name: design-system");
  L.push(`description: Design system extracted from ${domain}. Use this specification for all UI generation.`);
  L.push("---");
  L.push("");

  // ── 1. OVERVIEW ──
  L.push(`# Design System Specification: ${domain}`);
  L.push("");
  L.push("## 1. Overview & Creative Direction");
  L.push("");
  L.push(inferCreativeDirection(tokens));
  L.push("");
  if (tokens.platform.name !== "generic") {
    L.push(`> Built on **${tokens.platform.name}** (${Math.round(tokens.platform.confidence * 100)}% confidence)`);
    L.push("");
  }

  // ── 2. COLORS ──
  L.push("## 2. Colors & Surface Philosophy");
  L.push("");
  L.push("### Color Tokens");
  L.push("");
  L.push("| Token | Value | Usage |");
  L.push("|-------|-------|-------|");
  L.push(`| \`--color-primary\` | \`${v(tokens.colors.primary, "#0066ff")}\` | Primary actions, links, active states |`);
  L.push(`| \`--color-secondary\` | \`${v(tokens.colors.secondary, "#6b7280")}\` | Secondary text, icons, muted elements |`);
  L.push(`| \`--color-accent\` | \`${v(tokens.colors.accent, v(tokens.colors.primary, "#0066ff"))}\` | Highlights, badges, notifications |`);
  L.push(`| \`--color-background\` | \`${v(tokens.colors.background, "#ffffff")}\` | Page background |`);
  L.push(`| \`--color-surface\` | \`${v(tokens.colors.surface, "#f9fafb")}\` | Cards, modals, elevated surfaces |`);
  L.push(`| \`--color-text\` | \`${v(tokens.colors.text, "#111111")}\` | Primary text |`);
  L.push(`| \`--color-text-muted\` | \`${v(tokens.colors.textMuted, v(tokens.colors.secondary, "#6b7280"))}\` | Secondary text, captions |`);
  L.push("");

  // CSS variables if available
  const colorVars = Object.entries(tokens.cssVariables).filter(([k]) =>
    k.includes("color") || k.includes("bg") || k.includes("foreground") || k.includes("primary") || k.includes("accent"));
  if (colorVars.length > 0) {
    L.push(`<details><summary>Site's own CSS custom properties (${colorVars.length} color-related)</summary>`);
    L.push("");
    L.push("| Variable | Value |");
    L.push("|----------|-------|");
    for (const [k, val] of colorVars.slice(0, 30)) { L.push(`| \`${k}\` | \`${val}\` |`); }
    L.push("");
    L.push("</details>");
    L.push("");
  }

  L.push("### Surface Hierarchy");
  L.push("");
  L.push(inferSurfaceHierarchy(tokens));
  L.push("");

  // ── 3. TYPOGRAPHY ──
  L.push("## 3. Typography");
  L.push("");
  L.push("### Font Families");
  L.push("");

  // Describe font vibe
  function fontVibe(family: string): string {
    if (/grotesk|inter|dm sans|geist|manrope|outfit|plus jakarta/i.test(family)) return "geometric sans-serif — clean, modern, technical";
    if (/mono|code|fira|jetbrains|source code/i.test(family)) return "monospace — developer, systematic";
    if (/serif|georgia|times|playfair|lora|merriweather|source serif/i.test(family)) return "serif — editorial, premium, trustworthy";
    if (/sohne|suisse|neue|helvetica|arial/i.test(family)) return "neo-grotesque — minimal, Swiss-inspired, professional";
    if (/poppins|nunito|quicksand|comic/i.test(family)) return "rounded/friendly — approachable, consumer";
    return "sans-serif";
  }

  L.push(`- **Headings:** \`${headingFont}\` — ${fontVibe(headingFont)}`);
  if (headingWeights.length > 0) L.push(`  - Weights: ${headingWeights.join(", ")}`);
  L.push(`- **Body:** \`${bodyFont}\` — ${fontVibe(bodyFont)}`);
  if (bodyWeights.length > 0) L.push(`  - Weights: ${bodyWeights.join(", ")}`);
  L.push("- **Mono:** `monospace` — For code blocks, data tables, system text");
  L.push("");

  L.push("### Type Scale");
  L.push("");
  L.push("| Element | Size | Weight | Line Height | Letter Spacing | Usage |");
  L.push("|---------|------|--------|-------------|----------------|-------|");

  const usageMap: Record<string, string> = {
    H1: "Hero headlines, page titles",
    H2: "Section headers",
    H3: "Card titles, subsections",
    H4: "Small headings",
    H5: "Labels, overlines",
    H6: "Micro headings",
    Body: "Paragraphs, default text",
    Small: "Captions, helper text, labels",
  };

  for (const entry of tokens.typography.scale) {
    const usage = usageMap[entry.element] ?? "";
    L.push(`| ${entry.element} | ${entry.size}px | ${entry.weight} | ${entry.lineHeight} | ${entry.letterSpacing} | ${usage} |`);
  }
  L.push("");

  // ── 4. SPACING & LAYOUT ──
  L.push("## 4. Spacing & Layout");
  L.push("");
  L.push("### Base Unit");
  L.push(`**${base}px** — all spacing derives from this value`);
  L.push("");

  L.push("### Spacing Scale");
  L.push("");
  L.push("| Token | Value | Usage |");
  L.push("|-------|-------|-------|");

  const spacingUsage: Record<number, string> = {
    1: "Hairline gaps, tight inline spacing",
    2: "Icon gaps, compact padding",
    3: "Input padding, button padding",
    4: "Card padding, form gaps",
    6: "Section padding (small)",
    8: "Section gaps, large padding",
    10: "Major section spacing",
    12: "Page-level spacing",
    16: "Hero spacing, major breaks",
  };

  for (const mult of [1, 2, 3, 4, 6, 8, 10, 12, 16]) {
    const px = base * mult;
    L.push(`| \`--space-${mult}\` | ${px}px | ${spacingUsage[mult] ?? ""} |`);
  }
  L.push("");

  if (tokens.spacing.values.length > 0) {
    L.push(`<details><summary>Raw spacing values found on page (${tokens.spacing.values.length} unique)</summary>`);
    L.push("");
    L.push(`\`${tokens.spacing.values.join("px, ")}px\``);
    L.push("");
    L.push("</details>");
    L.push("");
  }

  L.push("### Border Radius");
  L.push("");
  L.push("| Token | Value | Usage |");
  L.push("|-------|-------|-------|");
  L.push(`| \`--radius-sm\` | ${tokens.radius.small ?? Math.max(base / 2, 2)}px | Buttons, inputs, badges |`);
  L.push(`| \`--radius-md\` | ${tokens.radius.medium ?? base * 2}px | Cards, dropdowns |`);
  L.push(`| \`--radius-lg\` | ${tokens.radius.large ?? base * 4}px | Modals, large containers |`);
  L.push("| `--radius-full` | 9999px | Avatars, pills |");
  L.push("");

  // Note about radius style
  const dom = tokens.radius.dominant;
  if (dom !== null) {
    if (dom === 0) L.push("> This design uses **sharp edges** (0px radius). Maintain this brutalist approach.");
    else if (dom <= 4) L.push("> This design uses **subtle rounding**. Keep corners crisp.");
    else if (dom >= 16) L.push("> This design uses **generous rounding**. Lean into the soft, friendly aesthetic.");
    L.push("");
  }

  // ── 5. SHADOWS ──
  if (tokens.shadows.length > 0) {
    L.push("### Shadows");
    L.push("");
    L.push("| Shadow | Usage |");
    L.push("|--------|-------|");
    for (const s of tokens.shadows.slice(0, 5)) {
      L.push(`| \`${s.value}\` | Found on: ${s.source} |`);
    }
    L.push("");
  }

  // ── 5. COMPONENT ARCHITECTURE (ATOMIC DESIGN) ──
  L.push("---");
  L.push("");
  L.push("## 5. Component Architecture (Atomic Design)");
  L.push("");
  L.push("Build UI by composing small, reusable pieces. Never write raw HTML with inline styles — always compose from atoms up.");
  L.push("");

  L.push("### Atoms");
  L.push("Single-purpose, stateless building blocks. Each consumes design tokens via CSS variables.");
  L.push("");
  L.push("| Component | Props | Notes |");
  L.push("|-----------|-------|-------|");
  L.push("| `Button` | variant (primary / secondary / ghost), size (sm / md / lg), disabled | Solid fill or outline per variant |");
  L.push("| `Input` | type (text / search / email), error, disabled | Bordered, focus ring |");
  L.push("| `Badge` | variant (default / accent / muted) | Pill shape, small text |");
  L.push("| `Typography` | as (h1–h4 / p / span / caption), weight | Maps to type scale |");
  L.push("| `Icon` | name, size (sm / md / lg), color | Wraps SVG icons |");
  L.push("| `Swatch` | color, label | Color preview circle + label |");
  L.push("| `Divider` | orientation (horizontal / vertical) | 1px border-color line |");
  L.push("");

  L.push("### Molecules");
  L.push("Combinations of 2–4 atoms that form a distinct UI pattern.");
  L.push("");
  L.push("| Component | Composed of | Notes |");
  L.push("|-----------|-------------|-------|");
  L.push("| `SearchBar` | Input + Button | Input with attached action button |");
  L.push("| `Card` | Surface + Typography + optional Button | Elevated container with content |");
  L.push("| `NavItem` | Icon + Typography | Navigation link with icon |");
  L.push("| `FormField` | Typography (label) + Input + Typography (error) | Label, input, validation message |");
  L.push("| `Tag` | Badge + Icon (optional close) | Removable pill |");
  L.push("| `Stat` | Typography (value) + Typography (label) | Metric display |");
  L.push("");

  L.push("### Organisms");
  L.push("Page-level sections composed of molecules and atoms.");
  L.push("");
  L.push("| Component | Composed of | Notes |");
  L.push("|-----------|-------------|-------|");
  L.push("| `Header` | Logo + NavItem[] + Button (CTA) | Sticky top bar |");
  L.push("| `Hero` | Typography (h1 + p) + SearchBar or Button | Above-the-fold section |");
  L.push("| `CardGrid` | Card[] | Responsive grid of cards |");
  L.push("| `Footer` | NavItem[] + Typography + Icon[] (social) | Page bottom |");
  L.push("| `Section` | Typography (heading) + any children | Generic page section wrapper |");
  L.push("");

  L.push("### Rules");
  L.push("- Each component gets its own file");
  L.push("- Components consume design tokens via CSS variables — never hardcode hex values");
  L.push("- Atoms are stateless; state lives in organisms or page-level components");
  L.push("- Compose upward: atoms → molecules → organisms → pages");
  L.push("");

  // ── 6. COMPONENT SPECS ──
  L.push("## 6. Component Specs");
  L.push("");

  L.push("### Buttons");
  L.push("");
  L.push(inferButtonStyle(tokens));
  L.push("");

  L.push("### Input Fields");
  L.push("");
  L.push(inferInputStyle(tokens));
  L.push("");

  L.push("### Cards");
  L.push("");
  L.push(inferCardStyle(tokens));
  L.push("");

  // ── 7. INTERACTIONS ──
  L.push("## 7. Interactions & Micro-animations");
  L.push("");

  // Button styles
  if (tokens.interactions.buttons.length > 0) {
    L.push("### Button Styles Found");
    L.push("");
    for (const btn of tokens.interactions.buttons.slice(0, 4)) {
      L.push(`**\`${btn.selector}\`**`);
      if (btn.gradient) {
        L.push(`- Background: gradient — \`${btn.gradient}\``);
      } else if (btn.backgroundColor) {
        L.push(`- Background: \`${btn.backgroundColor}\``);
      }
      if (btn.color) L.push(`- Text color: \`${btn.color}\``);
      L.push(`- Border radius: \`${btn.borderRadius}\``);
      L.push(`- Padding: \`${btn.padding}\``);
      L.push(`- Font: ${btn.fontWeight} / ${btn.fontSize}`);
      if (btn.textTransform !== "none") L.push(`- Text transform: ${btn.textTransform}`);
      if (btn.letterSpacing !== "0") L.push(`- Letter spacing: ${btn.letterSpacing}`);
      if (btn.border && btn.border !== "0px none rgb(0, 0, 0)") L.push(`- Border: \`${btn.border}\``);
      if (btn.boxShadow) L.push(`- Shadow: \`${btn.boxShadow}\``);
      if (btn.transition) L.push(`- Transition: \`${btn.transition}\``);
      L.push("");
    }
  }

  // Transitions
  if (tokens.interactions.transitions.length > 0) {
    L.push("### Transition Patterns");
    L.push("");
    L.push("| Property | Duration | Timing | Frequency |");
    L.push("|----------|----------|--------|-----------|");
    for (const t of tokens.interactions.transitions.slice(0, 8)) {
      L.push(`| ${t.property} | ${t.duration} | ${t.timing} | ×${t.count} |`);
    }
    L.push("");

    // Infer transition philosophy
    const avgDuration = tokens.interactions.transitions
      .map(t => parseFloat(t.duration))
      .filter(d => !isNaN(d));
    if (avgDuration.length > 0) {
      const avg = avgDuration.reduce((a, b) => a + b, 0) / avgDuration.length;
      if (avg <= 0.15) L.push("> Transitions are **snappy** (≤150ms) — interactions feel instant and responsive.");
      else if (avg <= 0.3) L.push("> Transitions are **balanced** (150–300ms) — smooth without feeling sluggish.");
      else L.push("> Transitions are **deliberate** (>300ms) — animated, elegant feel. Use ease-out curves.");
      L.push("");
    }
  }

  // Animations
  if (tokens.interactions.animations.length > 0) {
    L.push("### CSS Animations");
    L.push("");
    for (const a of tokens.interactions.animations) {
      L.push(`- \`${a.name}\` — found on \`${a.source}\``);
    }
    L.push("");
  }

  // Interaction rules
  L.push("### Interaction Rules");
  L.push("");
  L.push("- **Hover:** Use the transition durations above. Prefer `opacity`, `background-color`, or `box-shadow` transitions over `transform` for subtlety.");
  if (tokens.interactions.buttons.some(b => b.gradient)) {
    L.push("- **Gradients:** This brand uses gradients on interactive elements. Maintain gradient direction and stops.");
  }
  if (tokens.interactions.buttons.some(b => b.boxShadow)) {
    L.push("- **Shadow on hover:** Elevate buttons/cards on hover by intensifying the existing shadow.");
  }
  if (tokens.interactions.buttons.some(b => b.textTransform !== "none")) {
    L.push("- **Text transform:** Button text uses text-transform. Maintain this for consistency.");
  }
  L.push("- **Active:** `scale(0.98)` for tactile press feedback.");
  L.push("- **Focus:** 2px ring with `var(--color-primary)` for accessibility.");
  L.push("- **Disabled:** `opacity: 0.5`, `pointer-events: none`.");
  L.push("");

  // ── 8. RULES ──
  L.push("---");
  L.push("");
  L.push("## 8. Rules for AI Generation");
  L.push("");

  L.push("### Do:");
  L.push(`- Use **exact color values** from this spec — never Tailwind defaults`);
  L.push(`- Use \`${headingFont}\` for all headings`);
  L.push(`- Use \`${bodyFont}\` for body text`);
  L.push(`- Follow the **${base}px spacing scale** strictly`);
  L.push(`- Match border radius to the defined scale`);
  if (tokens.shadows.length > 0) {
    L.push("- Replicate the shadow values defined above for elevation");
  }
  L.push("- Match the **transition durations and timing** from the Interactions section");
  if (tokens.interactions.buttons.some(b => b.gradient)) {
    L.push("- Reproduce **gradients** on buttons and CTAs as specified");
  }
  L.push("- Use the exact button styles (padding, radius, weight) from the extracted patterns");
  L.push("");

  L.push("### Don't:");
  const neverFonts = ["Inter", "Roboto", "Arial", "Helvetica", "system-ui"]
    .filter((f) => !headingFont.toLowerCase().includes(f.toLowerCase()) && !bodyFont.toLowerCase().includes(f.toLowerCase()));
  if (neverFonts.length > 0) {
    L.push(`- Never use ${neverFonts.join(", ")} unless specified above`);
  }
  L.push("- Never use Tailwind default colors (`#3B82F6`, `#EF4444`, etc.)");
  L.push("- Never use arbitrary spacing values outside the scale");
  if (tokens.shadows.length === 0) {
    L.push("- Never add drop shadows — this design doesn't use them");
  }
  L.push("- Never use border-radius values outside the defined scale");
  L.push("- Never override these tokens with framework defaults");
  L.push("");

  // ── FOOTER ──
  L.push("---");
  L.push("");
  L.push(`*Extracted from [${domain}](${url}) by [Uncodebase](https://uncodebase.com)*`);
  L.push("");

  return L.join("\n");
}
