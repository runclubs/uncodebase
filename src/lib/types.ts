export interface DesignMeta {
  name: string;
  description: string;
  figmaFileKey?: string;
  figmaNodeId?: string;
}

export interface ColorTokens {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  ring: string;
  custom: Record<string, string>;
}

export interface TypeScaleEntry {
  size: string;
  lineHeight: string;
  weight: string;
}

export interface TypographyTokens {
  fontFamilySans: string;
  fontFamilyMono: string;
  fontFamilySerif: string;
  scale: Record<string, TypeScaleEntry>;
}

export interface SpacingTokens {
  baseUnit: number;
  scale: Record<string, string>;
  borderRadius: Record<string, string>;
}

export interface ComponentRules {
  preferredLibrary: string;
  rules: string[];
  patterns: string[];
}

export interface LayoutRules {
  maxWidth: string;
  breakpoints: Record<string, string>;
  columns: number;
  gutter: string;
  containerPadding: string;
  rules: string[];
}

export interface DesignSystem {
  meta: DesignMeta;
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  components: ComponentRules;
  layout: LayoutRules;
}

export type WizardSource = "manual" | "figma" | null;

export const WIZARD_STEPS = [
  "source",
  "colors",
  "typography",
  "spacing",
  "components",
  "layout",
  "preview",
  "export",
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];
