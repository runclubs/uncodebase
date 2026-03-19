export interface ColorToken {
  value: string;
  count: number;
  source: string;
}

export interface TypeScaleEntry {
  element: string;
  size: number;
  weight: number;
  lineHeight: number;
  letterSpacing: string;
}

export interface FontInfo {
  family: string;
  weights: number[];
}

export interface ShadowEntry {
  value: string;
  count: number;
  source: string;
}

export interface ScrapedTokens {
  url: string;
  domain: string;
  platform: {
    name: string;
    confidence: number;
    signals: string[];
  };
  colors: {
    primary: { value: string; source: string } | null;
    secondary: { value: string; source: string } | null;
    accent: { value: string; source: string } | null;
    background: { value: string; source: string } | null;
    surface: { value: string; source: string } | null;
    text: { value: string; source: string } | null;
    textMuted: { value: string; source: string } | null;
    allColors: ColorToken[];
  };
  typography: {
    headingFont: FontInfo | null;
    bodyFont: FontInfo | null;
    scale: TypeScaleEntry[];
  };
  spacing: {
    baseUnit: number | null;
    values: number[];
  };
  radius: {
    values: number[];
    dominant: number | null;
    small: number | null;
    medium: number | null;
    large: number | null;
  };
  shadows: ShadowEntry[];
  cssVariables: Record<string, string>;
}
