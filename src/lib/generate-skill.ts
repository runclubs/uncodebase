import type { DesignSystem } from "./types";

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateSkillFile(ds: DesignSystem): string {
  const name = ds.meta.name ? toKebabCase(ds.meta.name) : "design-system";
  const description = ds.meta.description || `Apply the ${ds.meta.name || "project"} design system when building UI`;

  const lines: string[] = [];

  // YAML frontmatter
  lines.push("---");
  lines.push(`name: ${name}`);
  lines.push(`description: ${description}`);
  lines.push(`globs:`);
  lines.push(`  - "**/*.tsx"`);
  lines.push(`  - "**/*.jsx"`);
  lines.push(`  - "**/*.css"`);
  lines.push(`  - "**/*.scss"`);
  lines.push(`alwaysApply: false`);
  lines.push("---");
  lines.push("");

  // Title
  lines.push(`# Design System: ${ds.meta.name || "Untitled"}`);
  lines.push("");
  if (ds.meta.description) {
    lines.push(ds.meta.description);
    lines.push("");
  }
  lines.push("Follow these rules strictly when creating or modifying UI components.");
  lines.push("");

  // Colors
  lines.push("## Colors");
  lines.push("");
  lines.push("Use these semantic color tokens. **Never use raw hex values** — always reference the token name.");
  lines.push("");
  lines.push("| Token | Value | Usage |");
  lines.push("|-------|-------|-------|");
  lines.push(`| primary | \`${ds.colors.primary}\` | Main brand color, CTAs, links, active states |`);
  lines.push(`| primary-foreground | \`${ds.colors.primaryForeground}\` | Text on primary backgrounds |`);
  lines.push(`| secondary | \`${ds.colors.secondary}\` | Secondary actions and backgrounds |`);
  lines.push(`| secondary-foreground | \`${ds.colors.secondaryForeground}\` | Text on secondary backgrounds |`);
  lines.push(`| background | \`${ds.colors.background}\` | Page/app background |`);
  lines.push(`| foreground | \`${ds.colors.foreground}\` | Default text color |`);
  lines.push(`| muted | \`${ds.colors.muted}\` | Muted/subtle backgrounds |`);
  lines.push(`| muted-foreground | \`${ds.colors.mutedForeground}\` | Secondary/muted text |`);
  lines.push(`| accent | \`${ds.colors.accent}\` | Accent highlights, hover states |`);
  lines.push(`| accent-foreground | \`${ds.colors.accentForeground}\` | Text on accent backgrounds |`);
  lines.push(`| destructive | \`${ds.colors.destructive}\` | Error states, danger actions, delete buttons |`);
  lines.push(`| border | \`${ds.colors.border}\` | Default border color |`);
  lines.push(`| ring | \`${ds.colors.ring}\` | Focus ring color |`);

  // Custom colors
  const customEntries = Object.entries(ds.colors.custom);
  if (customEntries.length > 0) {
    customEntries.forEach(([key, value]) => {
      lines.push(`| ${key} | \`${value}\` | Custom token |`);
    });
  }
  lines.push("");

  // Typography
  lines.push("## Typography");
  lines.push("");
  lines.push(`- **Sans-serif:** \`${ds.typography.fontFamilySans}\``);
  lines.push(`- **Monospace:** \`${ds.typography.fontFamilyMono}\``);
  if (ds.typography.fontFamilySerif) {
    lines.push(`- **Serif:** \`${ds.typography.fontFamilySerif}\``);
  }
  lines.push("");
  lines.push("### Type Scale");
  lines.push("");
  lines.push("| Name | Size | Line Height | Weight |");
  lines.push("|------|------|-------------|--------|");
  Object.entries(ds.typography.scale).forEach(([key, entry]) => {
    lines.push(`| ${key} | ${entry.size} | ${entry.lineHeight} | ${entry.weight} |`);
  });
  lines.push("");
  lines.push("Always use the type scale for font sizing. Do not use arbitrary font sizes.");
  lines.push("");

  // Spacing
  lines.push("## Spacing");
  lines.push("");
  lines.push(`Base unit: **${ds.spacing.baseUnit}px**`);
  lines.push("");
  lines.push("| Scale | Value |");
  lines.push("|-------|-------|");
  Object.entries(ds.spacing.scale).forEach(([key, value]) => {
    lines.push(`| ${key} | ${value} |`);
  });
  lines.push("");
  lines.push("### Border Radius");
  lines.push("");
  lines.push("| Token | Value |");
  lines.push("|-------|-------|");
  Object.entries(ds.spacing.borderRadius).forEach(([key, value]) => {
    lines.push(`| ${key} | ${value} |`);
  });
  lines.push("");
  lines.push("Use the spacing scale for all margin, padding, and gap values. Use border radius tokens consistently.");
  lines.push("");

  // Components
  lines.push("## Components & Patterns");
  lines.push("");
  lines.push(`**Preferred component library:** ${ds.components.preferredLibrary}`);
  lines.push("");
  if (ds.components.rules.length > 0) {
    lines.push("### Rules");
    lines.push("");
    ds.components.rules.forEach((rule) => {
      lines.push(`- ${rule}`);
    });
    lines.push("");
  }
  if (ds.components.patterns.length > 0) {
    lines.push("### Patterns");
    lines.push("");
    ds.components.patterns.forEach((pattern) => {
      lines.push(`- ${pattern}`);
    });
    lines.push("");
  }

  // Layout
  lines.push("## Layout");
  lines.push("");
  lines.push(`- **Max width:** ${ds.layout.maxWidth}`);
  lines.push(`- **Grid:** ${ds.layout.columns} columns with ${ds.layout.gutter} gutter`);
  lines.push(`- **Container padding:** ${ds.layout.containerPadding}`);
  lines.push("");
  lines.push("### Breakpoints");
  lines.push("");
  lines.push("| Name | Value |");
  lines.push("|------|-------|");
  Object.entries(ds.layout.breakpoints).forEach(([key, value]) => {
    lines.push(`| ${key} | ${value} |`);
  });
  lines.push("");
  if (ds.layout.rules.length > 0) {
    lines.push("### Layout Rules");
    lines.push("");
    ds.layout.rules.forEach((rule) => {
      lines.push(`- ${rule}`);
    });
    lines.push("");
  }

  // General instructions
  lines.push("## General Instructions");
  lines.push("");
  lines.push("When generating or modifying UI code:");
  lines.push("");
  lines.push("1. **Always use semantic color tokens** — never hardcode hex/rgb values");
  lines.push("2. **Follow the type scale exactly** — do not use arbitrary font sizes");
  lines.push("3. **Use the spacing scale** for all margin, padding, and gap values");
  lines.push("4. **Use border radius tokens** consistently across components");
  lines.push(`5. **Prefer ${ds.components.preferredLibrary} components** when available`);
  lines.push("6. **Ensure responsive design** using the defined breakpoints");
  lines.push("7. **All interactive elements** must have visible focus states using the ring token");
  lines.push("8. **Maintain accessibility** — proper contrast ratios, ARIA labels, semantic HTML");
  lines.push("");

  return lines.join("\n");
}
