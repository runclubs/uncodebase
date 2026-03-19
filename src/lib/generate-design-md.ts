import type { DesignSystem } from "./types";

export function generateDesignMd(ds: DesignSystem): string {
  const lines: string[] = [];

  lines.push(`# ${ds.meta.name || "Design System"}`);
  lines.push("");
  if (ds.meta.description) {
    lines.push(`> ${ds.meta.description}`);
    lines.push("");
  }
  if (ds.meta.figmaFileKey) {
    lines.push(`Figma file: \`${ds.meta.figmaFileKey}\``);
    lines.push("");
  }

  // Colors
  lines.push("## Color Tokens");
  lines.push("");
  lines.push("### Semantic Colors");
  lines.push("");
  lines.push("| Token | Value | Preview |");
  lines.push("|-------|-------|---------|");

  const colorEntries: [string, string][] = [
    ["primary", ds.colors.primary],
    ["primary-foreground", ds.colors.primaryForeground],
    ["secondary", ds.colors.secondary],
    ["secondary-foreground", ds.colors.secondaryForeground],
    ["background", ds.colors.background],
    ["foreground", ds.colors.foreground],
    ["muted", ds.colors.muted],
    ["muted-foreground", ds.colors.mutedForeground],
    ["accent", ds.colors.accent],
    ["accent-foreground", ds.colors.accentForeground],
    ["destructive", ds.colors.destructive],
    ["border", ds.colors.border],
    ["ring", ds.colors.ring],
  ];

  colorEntries.forEach(([name, value]) => {
    lines.push(`| \`--${name}\` | \`${value}\` | ![${name}](https://via.placeholder.com/20/${value.replace("#", "")}/${value.replace("#", "")}) |`);
  });
  lines.push("");

  // Custom colors
  const customEntries = Object.entries(ds.colors.custom);
  if (customEntries.length > 0) {
    lines.push("### Custom Colors");
    lines.push("");
    lines.push("| Token | Value |");
    lines.push("|-------|-------|");
    customEntries.forEach(([key, value]) => {
      lines.push(`| \`--${key}\` | \`${value}\` |`);
    });
    lines.push("");
  }

  // Usage examples
  lines.push("### Color Usage Guidelines");
  lines.push("");
  lines.push("```css");
  lines.push("/* DO: Use semantic tokens */");
  lines.push(".button-primary {");
  lines.push("  background-color: var(--primary);");
  lines.push("  color: var(--primary-foreground);");
  lines.push("}");
  lines.push("");
  lines.push(`/* DON'T: Hardcode values */`);
  lines.push(".button-primary {");
  lines.push(`  background-color: ${ds.colors.primary}; /* Never do this */`);
  lines.push("}");
  lines.push("```");
  lines.push("");

  // Typography
  lines.push("## Typography");
  lines.push("");
  lines.push("### Font Families");
  lines.push("");
  lines.push(`- **Sans-serif:** \`${ds.typography.fontFamilySans}\``);
  lines.push(`- **Monospace:** \`${ds.typography.fontFamilyMono}\``);
  if (ds.typography.fontFamilySerif) {
    lines.push(`- **Serif:** \`${ds.typography.fontFamilySerif}\``);
  }
  lines.push("");
  lines.push("### Type Scale");
  lines.push("");
  lines.push("| Name | Size | Line Height | Weight | Usage |");
  lines.push("|------|------|-------------|--------|-------|");

  const scaleUsage: Record<string, string> = {
    xs: "Captions, fine print",
    sm: "Helper text, labels",
    base: "Body text, paragraphs",
    lg: "Lead text, introductions",
    xl: "Section headings (h4)",
    "2xl": "Page section headings (h3)",
    "3xl": "Page headings (h2)",
    "4xl": "Hero headings (h1)",
  };

  Object.entries(ds.typography.scale).forEach(([key, entry]) => {
    const usage = scaleUsage[key] || "";
    lines.push(`| ${key} | ${entry.size} | ${entry.lineHeight} | ${entry.weight} | ${usage} |`);
  });
  lines.push("");

  // Spacing
  lines.push("## Spacing");
  lines.push("");
  lines.push(`Base unit: **${ds.spacing.baseUnit}px**`);
  lines.push("");
  lines.push("### Spacing Scale");
  lines.push("");
  lines.push("| Token | Value | Pixels |");
  lines.push("|-------|-------|--------|");
  Object.entries(ds.spacing.scale).forEach(([key, value]) => {
    lines.push(`| spacing-${key} | ${value} | ${parseInt(value)}px |`);
  });
  lines.push("");

  lines.push("### Border Radius");
  lines.push("");
  lines.push("| Token | Value |");
  lines.push("|-------|-------|");
  Object.entries(ds.spacing.borderRadius).forEach(([key, value]) => {
    lines.push(`| radius-${key} | ${value} |`);
  });
  lines.push("");

  // Components
  lines.push("## Components");
  lines.push("");
  lines.push(`**Preferred library:** ${ds.components.preferredLibrary}`);
  lines.push("");

  if (ds.components.rules.length > 0) {
    lines.push("### Design Rules");
    lines.push("");
    ds.components.rules.forEach((rule, i) => {
      lines.push(`${i + 1}. ${rule}`);
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
  lines.push("### Grid System");
  lines.push("");
  lines.push(`| Property | Value |`);
  lines.push(`|----------|-------|`);
  lines.push(`| Max width | ${ds.layout.maxWidth} |`);
  lines.push(`| Columns | ${ds.layout.columns} |`);
  lines.push(`| Gutter | ${ds.layout.gutter} |`);
  lines.push(`| Container padding | ${ds.layout.containerPadding} |`);
  lines.push("");

  lines.push("### Breakpoints");
  lines.push("");
  lines.push("| Name | Min Width | Usage |");
  lines.push("|------|-----------|-------|");

  const breakpointUsage: Record<string, string> = {
    sm: "Mobile landscape",
    md: "Tablets",
    lg: "Small desktops",
    xl: "Desktops",
    "2xl": "Large screens",
  };

  Object.entries(ds.layout.breakpoints).forEach(([key, value]) => {
    const usage = breakpointUsage[key] || "";
    lines.push(`| ${key} | ${value} | ${usage} |`);
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

  // Footer
  lines.push("---");
  lines.push("");
  lines.push("*Generated by [Uncodebase](https://github.com/uncodebase) — Design System Skill Generator*");
  lines.push("");

  return lines.join("\n");
}
