import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import type { ScrapedTokens } from "@/lib/scrape-types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let browser;
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    await page.goto(parsedUrl.toString(), {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page.waitForTimeout(1000);

    const tokens: ScrapedTokens = await page.evaluate((inputDomain: string) => {
      // ═══════════════════════════════════
      // HELPERS
      // ═══════════════════════════════════

      function rgbToHex(rgb: string): string | null {
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return null;
        const [, r, g, b] = match;
        return "#" + [r, g, b].map((x) => parseInt(x).toString(16).padStart(2, "0")).join("");
      }

      function luminance(hex: string): number {
        const rgb = hex.replace("#", "").match(/.{2}/g)!.map((x) => parseInt(x, 16) / 255);
        return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
      }

      function isNearWhite(hex: string): boolean { return luminance(hex) > 0.93; }
      function isNearBlack(hex: string): boolean { return luminance(hex) < 0.07; }
      function isGray(hex: string): boolean {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return Math.max(r, g, b) - Math.min(r, g, b) < 20;
      }

      function colorDistance(a: string, b: string): number {
        const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
        const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
        return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
      }

      // ═══════════════════════════════════
      // 1. PLATFORM DETECTION
      // ═══════════════════════════════════

      const signals: string[] = [];
      let platformName = "generic";
      let confidence = 0;

      const wfAttrs = document.querySelectorAll("[data-wf-site], [data-wf-page]");
      const wfScript = document.querySelector('script[src*="webflow"], link[href*="webflow"], meta[content*="webflow"]');
      if (wfAttrs.length > 0 || wfScript) {
        platformName = "webflow"; confidence = wfAttrs.length > 0 ? 0.95 : 0.7;
        if (wfAttrs.length > 0) signals.push("data-wf-* attributes");
        if (wfScript) signals.push("Webflow script/link");
      }

      const framerEls = document.querySelectorAll('[class*="framer-"], [data-framer-component-type]');
      const framerScript = document.querySelector('script[src*="framer"], meta[content*="framer"]');
      if (framerEls.length > 0 || framerScript) {
        platformName = "framer"; confidence = framerEls.length > 5 ? 0.95 : 0.7;
        if (framerEls.length > 0) signals.push(`${framerEls.length} framer-* elements`);
        if (framerScript) signals.push("Framer script/meta");
      }

      const wpEl = document.querySelector('meta[name="generator"][content*="WordPress"], link[href*="wp-content"]');
      if (wpEl) { platformName = "wordpress"; confidence = 0.9; signals.push("WordPress detected"); }

      const sqspEl = document.querySelector('meta[content*="Squarespace"], script[src*="squarespace"], [class*="sqsp-"]');
      if (sqspEl) { platformName = "squarespace"; confidence = 0.9; signals.push("Squarespace detected"); }

      const shopifyEl = document.querySelector('meta[name="shopify-checkout-api-token"], link[href*="cdn.shopify"]');
      if (shopifyEl) { platformName = "shopify"; confidence = 0.9; signals.push("Shopify detected"); }

      if (platformName === "generic") { confidence = 0.5; signals.push("No specific platform detected"); }

      // ═══════════════════════════════════
      // 2. CSS CUSTOM PROPERTIES
      // ═══════════════════════════════════

      const cssVariables: Record<string, string> = {};
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (rule instanceof CSSStyleRule &&
              (rule.selectorText === ":root" || rule.selectorText === "html" ||
                rule.selectorText === "body" || rule.selectorText?.includes(":root"))) {
              for (let i = 0; i < rule.style.length; i++) {
                const prop = rule.style[i];
                if (prop.startsWith("--")) {
                  cssVariables[prop] = rule.style.getPropertyValue(prop).trim();
                }
              }
            }
          }
        } catch { /* CORS */ }
      }

      // ═══════════════════════════════════
      // 3. COLORS — enriched with sources
      // ═══════════════════════════════════

      const colorMap = new Map<string, { count: number; sources: Set<string> }>();

      function addColor(hex: string, source: string) {
        if (!hex || hex === "none" || hex === "transparent") return;
        const lower = hex.toLowerCase();
        if (!colorMap.has(lower)) colorMap.set(lower, { count: 0, sources: new Set() });
        const e = colorMap.get(lower)!;
        e.count++;
        e.sources.add(source);
      }

      const allEls = Array.from(document.querySelectorAll(
        "body, body *, header, nav, main, section, footer, div, p, span, h1, h2, h3, h4, h5, h6, a, button, input, li, td, th"
      )).slice(0, 500);

      for (const el of allEls) {
        const s = getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        const bg = rgbToHex(s.backgroundColor); if (bg) addColor(bg, `${tag}.bg`);
        const txt = rgbToHex(s.color); if (txt) addColor(txt, `${tag}.text`);
        const brd = rgbToHex(s.borderColor);
        if (brd && s.borderWidth !== "0px") addColor(brd, `${tag}.border`);
      }

      // Buttons & links specifically
      const btns = Array.from(document.querySelectorAll('button, [role="button"], a.btn, .btn, .button, input[type="submit"]')).slice(0, 50);
      for (const btn of btns) {
        const s = getComputedStyle(btn);
        const bg = rgbToHex(s.backgroundColor); if (bg) addColor(bg, "button.bg");
        const txt = rgbToHex(s.color); if (txt) addColor(txt, "button.text");
      }
      const links = Array.from(document.querySelectorAll("a[href]")).slice(0, 50);
      for (const link of links) {
        const txt = rgbToHex(getComputedStyle(link).color); if (txt) addColor(txt, "link.text");
      }

      // Dedupe similar colors (within ~5% / distance < 13)
      const rawColors = Array.from(colorMap.entries())
        .map(([value, d]) => ({ value, count: d.count, source: Array.from(d.sources).join(", ") }))
        .sort((a, b) => b.count - a.count);

      const dedupedColors: typeof rawColors = [];
      for (const c of rawColors) {
        const similar = dedupedColors.find((d) => colorDistance(c.value, d.value) < 13);
        if (similar) {
          similar.count += c.count;
          similar.source += `, ${c.source}`;
        } else {
          dedupedColors.push({ ...c });
        }
      }
      dedupedColors.sort((a, b) => b.count - a.count);

      // Classify
      const bodyBg = rgbToHex(getComputedStyle(document.body).backgroundColor);
      const bodyTxt = rgbToHex(getComputedStyle(document.body).color);

      const bgColor = bodyBg && !isNearBlack(bodyBg) ? bodyBg :
        dedupedColors.find((c) => c.source.includes("bg") && isNearWhite(c.value))?.value ?? null;

      const textColor = bodyTxt && (isNearBlack(bodyTxt) || luminance(bodyTxt) < 0.3) ? bodyTxt :
        dedupedColors.find((c) => c.source.includes("text") && isNearBlack(c.value))?.value ?? null;

      // Primary from buttons/links — chromatic only
      const btnColors = dedupedColors.filter((c) =>
        (c.source.includes("button") || c.source.includes("link")) &&
        !isNearWhite(c.value) && !isNearBlack(c.value) && !isGray(c.value));
      let primaryColor: string | null = btnColors[0]?.value ?? null;
      let primarySource: string = btnColors[0]?.source ?? "";
      if (!primaryColor) {
        const fallback = dedupedColors.find((c) => !isNearWhite(c.value) && !isNearBlack(c.value) && !isGray(c.value) && c.count >= 2);
        primaryColor = fallback?.value ?? null;
        primarySource = fallback?.source ?? "";
      }

      const secondary = dedupedColors.find((c) =>
        c.value !== primaryColor && c.value !== bgColor && c.value !== textColor &&
        (isGray(c.value) || c.source.includes("border")) &&
        !isNearWhite(c.value) && !isNearBlack(c.value));

      const accent = dedupedColors.find((c) =>
        c.value !== primaryColor && c.value !== secondary?.value && c.value !== bgColor && c.value !== textColor &&
        !isNearWhite(c.value) && !isNearBlack(c.value) && !isGray(c.value));

      const surface = dedupedColors.find((c) =>
        c.source.includes("bg") && c.value !== bgColor && isNearWhite(c.value) && c.value !== "#ffffff");

      // text-muted: a gray or lighter text color
      const textMuted = dedupedColors.find((c) =>
        c.source.includes("text") && c.value !== textColor && isGray(c.value) &&
        !isNearWhite(c.value) && !isNearBlack(c.value));

      // ═══════════════════════════════════
      // 4. TYPOGRAPHY — enriched
      // ═══════════════════════════════════

      const headingWeights = new Set<number>();
      const bodyWeights = new Set<number>();
      let headingFamily: string | null = null;
      let bodyFamily: string | null = null;

      const bodyStyle = getComputedStyle(document.body);
      bodyFamily = bodyStyle.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
      const bw = parseInt(bodyStyle.fontWeight);
      if (!isNaN(bw)) bodyWeights.add(bw);

      const typeScale: { element: string; size: number; weight: number; lineHeight: number; letterSpacing: string }[] = [];

      for (const tag of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
        const el = document.querySelector(tag);
        if (el) {
          const s = getComputedStyle(el);
          const font = s.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
          if (!headingFamily) headingFamily = font;
          const w = parseInt(s.fontWeight);
          if (!isNaN(w)) headingWeights.add(w);
          typeScale.push({
            element: tag.toUpperCase(),
            size: Math.round(parseFloat(s.fontSize)),
            weight: isNaN(w) ? 400 : w,
            lineHeight: parseFloat((parseFloat(s.lineHeight) / parseFloat(s.fontSize)).toFixed(2)) || 1.2,
            letterSpacing: s.letterSpacing === "normal" ? "0" : s.letterSpacing,
          });
        }
      }

      // Body & small
      const bodyP = document.querySelector("p");
      if (bodyP) {
        const s = getComputedStyle(bodyP);
        const w = parseInt(s.fontWeight);
        if (!isNaN(w)) bodyWeights.add(w);
        typeScale.push({
          element: "Body",
          size: Math.round(parseFloat(s.fontSize)),
          weight: isNaN(w) ? 400 : w,
          lineHeight: parseFloat((parseFloat(s.lineHeight) / parseFloat(s.fontSize)).toFixed(2)) || 1.5,
          letterSpacing: s.letterSpacing === "normal" ? "0" : s.letterSpacing,
        });
      }
      const smallEl = document.querySelector("small, .text-sm, .text-xs, .small, .caption");
      if (smallEl) {
        const s = getComputedStyle(smallEl);
        const w = parseInt(s.fontWeight);
        if (!isNaN(w)) bodyWeights.add(w);
        typeScale.push({
          element: "Small",
          size: Math.round(parseFloat(s.fontSize)),
          weight: isNaN(w) ? 400 : w,
          lineHeight: parseFloat((parseFloat(s.lineHeight) / parseFloat(s.fontSize)).toFixed(2)) || 1.4,
          letterSpacing: s.letterSpacing === "normal" ? "0" : s.letterSpacing,
        });
      }

      // Collect more weights from visible elements
      for (const el of allEls.slice(0, 100)) {
        const w = parseInt(getComputedStyle(el).fontWeight);
        if (!isNaN(w)) bodyWeights.add(w);
      }

      // ═══════════════════════════════════
      // 5. SPACING — return raw px numbers
      // ═══════════════════════════════════

      const spacingMap = new Map<number, number>();

      for (const el of allEls.slice(0, 200)) {
        const s = getComputedStyle(el);
        const vals = [
          s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft,
          s.marginTop, s.marginRight, s.marginBottom, s.marginLeft,
          s.gap, s.rowGap, s.columnGap,
        ];
        for (const v of vals) {
          if (v && v !== "0px" && v !== "auto" && v !== "normal") {
            const px = Math.round(parseFloat(v));
            if (px > 0 && px <= 200) {
              spacingMap.set(px, (spacingMap.get(px) || 0) + 1);
            }
          }
        }
      }

      const spacingPairs = Array.from(spacingMap.entries()).sort((a, b) => b[1] - a[1]);
      const topSpacing = spacingPairs.slice(0, 10).map(([v]) => v);

      let baseUnit: number | null = null;
      for (const candidate of [4, 8, 6, 5]) {
        const matching = topSpacing.filter((v) => v % candidate === 0);
        if (matching.length >= topSpacing.length * 0.6) { baseUnit = candidate; break; }
      }

      // Dedupe to scale: unique values sorted ascending
      const spacingValues = [...new Set(spacingPairs.map(([v]) => v))].sort((a, b) => a - b);

      // ═══════════════════════════════════
      // 6. BORDER RADIUS — px numbers
      // ═══════════════════════════════════

      const radiusMap = new Map<number, number>();

      for (const el of allEls.slice(0, 200)) {
        const r = getComputedStyle(el).borderRadius;
        if (r && r !== "0px") {
          const px = Math.round(parseFloat(r));
          if (px > 0 && px < 9999) {
            radiusMap.set(px, (radiusMap.get(px) || 0) + 1);
          }
        }
      }

      const radiusPairs = Array.from(radiusMap.entries()).sort((a, b) => b[1] - a[1]);
      const radiusValues = [...new Set(radiusPairs.map(([v]) => v))].sort((a, b) => a - b);
      const dominant = radiusPairs.length > 0 ? radiusPairs[0][0] : null;

      let smallR: number | null = null;
      let medR: number | null = null;
      let largeR: number | null = null;

      if (radiusValues.length >= 3) {
        smallR = radiusValues[0];
        medR = radiusValues[Math.floor(radiusValues.length / 2)];
        largeR = radiusValues[radiusValues.length - 1];
      } else if (radiusValues.length === 2) {
        smallR = radiusValues[0];
        medR = radiusValues[1];
      } else if (radiusValues.length === 1) {
        medR = radiusValues[0];
      }

      // ═══════════════════════════════════
      // 7. SHADOWS
      // ═══════════════════════════════════

      const shadowMap = new Map<string, { count: number; sources: Set<string> }>();

      for (const el of allEls.slice(0, 200)) {
        const s = getComputedStyle(el);
        const shadow = s.boxShadow;
        if (shadow && shadow !== "none") {
          const tag = el.tagName.toLowerCase();
          if (!shadowMap.has(shadow)) shadowMap.set(shadow, { count: 0, sources: new Set() });
          const entry = shadowMap.get(shadow)!;
          entry.count++;
          entry.sources.add(tag);
        }
      }

      const shadows = Array.from(shadowMap.entries())
        .map(([value, d]) => ({ value, count: d.count, source: Array.from(d.sources).join(", ") }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // ═══════════════════════════════════
      // RETURN
      // ═══════════════════════════════════

      return {
        url: window.location.href,
        domain: inputDomain,
        platform: { name: platformName, confidence, signals },
        colors: {
          primary: primaryColor ? { value: primaryColor, source: primarySource } : null,
          secondary: secondary ? { value: secondary.value, source: secondary.source } : null,
          accent: accent ? { value: accent.value, source: accent.source } : null,
          background: bgColor ? { value: bgColor, source: "body.bg" } : null,
          surface: surface ? { value: surface.value, source: surface.source } : null,
          text: textColor ? { value: textColor, source: "body.text" } : null,
          textMuted: textMuted ? { value: textMuted.value, source: textMuted.source } : null,
          allColors: dedupedColors.slice(0, 30),
        },
        typography: {
          headingFont: headingFamily ? { family: headingFamily, weights: Array.from(headingWeights).sort((a, b) => a - b) } : null,
          bodyFont: bodyFamily ? { family: bodyFamily, weights: Array.from(bodyWeights).sort((a, b) => a - b) } : null,
          scale: typeScale,
        },
        spacing: {
          baseUnit,
          values: spacingValues,
        },
        radius: {
          values: radiusValues,
          dominant,
          small: smallR,
          medium: medR,
          large: largeR,
        },
        shadows,
        cssVariables,
      } satisfies ScrapedTokens;
    }, parsedUrl.hostname.replace(/^www\./, ""));

    await browser.close();
    return NextResponse.json(tokens);
  } catch (error) {
    if (browser) await browser.close();
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Scrape error:", message);
    return NextResponse.json({ error: `Failed to scrape: ${message}` }, { status: 500 });
  }
}
