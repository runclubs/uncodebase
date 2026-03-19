import type { ScrapedTokens } from "./scrape-types";

export interface AnalyzerSuggestion {
  type: "warning" | "info" | "improvement";
  message: string;
}

export function analyzeTokens(tokens: ScrapedTokens): AnalyzerSuggestion[] {
  const suggestions: AnalyzerSuggestion[] = [];

  // ── Color analysis ──

  if (!tokens.colors.primary) {
    suggestions.push({
      type: "warning",
      message: "No primary color detected. The site may use images or gradients instead of solid colors for CTAs.",
    });
  }

  if (!tokens.colors.accent) {
    suggestions.push({
      type: "info",
      message: "No accent color found — primary color will be used for highlights and badges.",
    });
  }

  if (!tokens.colors.surface) {
    suggestions.push({
      type: "info",
      message: "No distinct surface color found. Cards may use the same background as the page.",
    });
  }

  // Count grays
  const grays = tokens.colors.allColors.filter((c) => {
    const r = parseInt(c.value.slice(1, 3), 16);
    const g = parseInt(c.value.slice(3, 5), 16);
    const b = parseInt(c.value.slice(5, 7), 16);
    return Math.max(r, g, b) - Math.min(r, g, b) < 20;
  });
  if (grays.length > 8) {
    suggestions.push({
      type: "improvement",
      message: `Found ${grays.length} gray variations. Consider consolidating to 4-5 semantic grays for consistency.`,
    });
  }

  // Count total chromatic colors
  const chromatic = tokens.colors.allColors.filter((c) => {
    const r = parseInt(c.value.slice(1, 3), 16);
    const g = parseInt(c.value.slice(3, 5), 16);
    const b = parseInt(c.value.slice(5, 7), 16);
    const lum = 0.2126 * r / 255 + 0.7152 * g / 255 + 0.0722 * b / 255;
    return Math.max(r, g, b) - Math.min(r, g, b) >= 20 && lum > 0.07 && lum < 0.93;
  });
  if (chromatic.length > 6) {
    suggestions.push({
      type: "improvement",
      message: `${chromatic.length} distinct chromatic colors found. A focused palette uses 2-4 brand colors.`,
    });
  }

  if (Object.keys(tokens.cssVariables).length === 0) {
    suggestions.push({
      type: "info",
      message: "No CSS custom properties found. This site uses hardcoded values rather than a token system.",
    });
  }

  // ── Typography analysis ──

  if (!tokens.typography.headingFont) {
    suggestions.push({
      type: "warning",
      message: "No heading font detected. The site may not have visible headings.",
    });
  }

  if (tokens.typography.headingFont?.family === tokens.typography.bodyFont?.family) {
    suggestions.push({
      type: "info",
      message: `Same font (${tokens.typography.headingFont?.family}) used for headings and body. This creates a unified, clean look.`,
    });
  }

  if (tokens.typography.scale.length < 3) {
    suggestions.push({
      type: "warning",
      message: "Sparse type scale detected. Only found styles for a few elements.",
    });
  }

  // Check for odd font sizes that don't follow a scale
  const sizes = tokens.typography.scale.map((s) => s.size).sort((a, b) => a - b);
  if (sizes.length >= 3) {
    const ratios: number[] = [];
    for (let i = 1; i < sizes.length; i++) {
      if (sizes[i - 1] > 0) ratios.push(sizes[i] / sizes[i - 1]);
    }
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const variance = ratios.reduce((a, r) => a + (r - avgRatio) ** 2, 0) / ratios.length;
    if (variance > 0.1) {
      suggestions.push({
        type: "improvement",
        message: "Type scale doesn't follow a consistent ratio. Consider normalizing to a modular scale (1.125, 1.2, or 1.25).",
      });
    }
  }

  // ── Spacing analysis ──

  if (!tokens.spacing.baseUnit) {
    suggestions.push({
      type: "warning",
      message: "Could not detect a clear spacing base unit. Spacing may be inconsistent.",
    });
  }

  if (tokens.spacing.values.length > 15) {
    suggestions.push({
      type: "improvement",
      message: `${tokens.spacing.values.length} unique spacing values found. A clean system uses 8-12 values from a base unit.`,
    });
  }

  // ── Radius analysis ──

  if (tokens.radius.values.length === 0) {
    suggestions.push({
      type: "info",
      message: "No border radius detected. This design uses sharp corners.",
    });
  }

  if (tokens.radius.values.length > 5) {
    suggestions.push({
      type: "improvement",
      message: `${tokens.radius.values.length} different border-radius values. Consider consolidating to sm/md/lg/full.`,
    });
  }

  // ── Shadow analysis ──

  if (tokens.shadows.length === 0) {
    suggestions.push({
      type: "info",
      message: "No box shadows found. This design relies on borders or color for depth.",
    });
  }

  // ── Platform-specific ──

  if (tokens.platform.name === "webflow") {
    suggestions.push({
      type: "info",
      message: "Webflow site detected. CSS classes may use Webflow's naming conventions.",
    });
  }

  if (tokens.platform.name === "framer") {
    suggestions.push({
      type: "info",
      message: "Framer site detected. Styles may be generated/scoped, making token extraction less precise.",
    });
  }

  return suggestions;
}
