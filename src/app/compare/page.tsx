"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { ScrapedTokens } from "@/lib/scrape-types";

/* ── helpers ─────────────────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function colorDistance(a: string, b: string): number {
  const ra = hexToRgb(a), rb = hexToRgb(b);
  if (!ra || !rb) return 999;
  return Math.sqrt((ra[0] - rb[0]) ** 2 + (ra[1] - rb[1]) ** 2 + (ra[2] - rb[2]) ** 2);
}

interface ComparisonResult {
  overall: number;
  colors: { score: number; details: string[] };
  typography: { score: number; details: string[] };
  spacing: { score: number; details: string[] };
  radius: { score: number; details: string[] };
}

function compareTokens(brand: ScrapedTokens, target: ScrapedTokens): ComparisonResult {
  const colorPairs: [string, string | null, string | null][] = [
    ["Primary", brand.colors.primary?.value ?? null, target.colors.primary?.value ?? null],
    ["Background", brand.colors.background?.value ?? null, target.colors.background?.value ?? null],
    ["Text", brand.colors.text?.value ?? null, target.colors.text?.value ?? null],
    ["Accent", brand.colors.accent?.value ?? null, target.colors.accent?.value ?? null],
    ["Surface", brand.colors.surface?.value ?? null, target.colors.surface?.value ?? null],
  ];

  let colorTotal = 0, colorCount = 0;
  const colorDetails: string[] = [];
  for (const [name, a, b] of colorPairs) {
    if (!a || !b) { colorDetails.push(`${name}: missing on one side`); continue; }
    const dist = colorDistance(a, b);
    const score = Math.max(0, 100 - (dist / 4.41) * 100); // max dist ~441
    colorTotal += score;
    colorCount++;
    if (score >= 90) colorDetails.push(`${name}: near-identical (${a} vs ${b})`);
    else if (score >= 60) colorDetails.push(`${name}: similar (${a} vs ${b})`);
    else colorDetails.push(`${name}: different (${a} vs ${b})`);
  }
  const colorScore = colorCount > 0 ? colorTotal / colorCount : 0;

  // Typography
  const typoDetails: string[] = [];
  let typoScore = 0, typoFactors = 0;

  const bHead = brand.typography.headingFont?.family?.toLowerCase();
  const tHead = target.typography.headingFont?.family?.toLowerCase();
  if (bHead && tHead) {
    typoFactors++;
    if (bHead === tHead) { typoScore += 100; typoDetails.push(`Heading font: match (${brand.typography.headingFont!.family})`); }
    else { typoDetails.push(`Heading font: ${brand.typography.headingFont!.family} vs ${target.typography.headingFont!.family}`); }
  }

  const bBody = brand.typography.bodyFont?.family?.toLowerCase();
  const tBody = target.typography.bodyFont?.family?.toLowerCase();
  if (bBody && tBody) {
    typoFactors++;
    if (bBody === tBody) { typoScore += 100; typoDetails.push(`Body font: match (${brand.typography.bodyFont!.family})`); }
    else { typoDetails.push(`Body font: ${brand.typography.bodyFont!.family} vs ${target.typography.bodyFont!.family}`); }
  }

  if (brand.typography.scale.length > 0 && target.typography.scale.length > 0) {
    typoFactors++;
    const bSizes = brand.typography.scale.map(s => s.size).sort((a, b) => a - b);
    const tSizes = target.typography.scale.map(s => s.size).sort((a, b) => a - b);
    const overlap = bSizes.filter(s => tSizes.some(t => Math.abs(t - s) <= 2)).length;
    const ratio = overlap / Math.max(bSizes.length, tSizes.length);
    typoScore += ratio * 100;
    typoDetails.push(`Type scale: ${Math.round(ratio * 100)}% size overlap`);
  }

  const finalTypo = typoFactors > 0 ? typoScore / typoFactors : 50;

  // Spacing
  const spacingDetails: string[] = [];
  let spacingScore = 50;
  if (brand.spacing.baseUnit && target.spacing.baseUnit) {
    if (brand.spacing.baseUnit === target.spacing.baseUnit) {
      spacingScore = 100;
      spacingDetails.push(`Base unit: match (${brand.spacing.baseUnit}px)`);
    } else {
      spacingScore = Math.max(0, 100 - Math.abs(brand.spacing.baseUnit - target.spacing.baseUnit) * 15);
      spacingDetails.push(`Base unit: ${brand.spacing.baseUnit}px vs ${target.spacing.baseUnit}px`);
    }
  } else {
    spacingDetails.push("Base unit: not detected on one side");
  }

  // Radius
  const radiusDetails: string[] = [];
  let radiusScore = 50;
  if (brand.radius.dominant != null && target.radius.dominant != null) {
    const diff = Math.abs(brand.radius.dominant - target.radius.dominant);
    radiusScore = Math.max(0, 100 - diff * 8);
    if (diff <= 1) radiusDetails.push(`Dominant radius: match (~${brand.radius.dominant}px)`);
    else radiusDetails.push(`Dominant radius: ${brand.radius.dominant}px vs ${target.radius.dominant}px`);
  } else {
    radiusDetails.push("Dominant radius: not detected on one side");
  }

  const overall = Math.round(colorScore * 0.4 + finalTypo * 0.25 + spacingScore * 0.2 + radiusScore * 0.15);

  return {
    overall,
    colors: { score: Math.round(colorScore), details: colorDetails },
    typography: { score: Math.round(finalTypo), details: typoDetails },
    spacing: { score: Math.round(spacingScore), details: spacingDetails },
    radius: { score: Math.round(radiusScore), details: radiusDetails },
  };
}

/* ── components ──────────────────────────────────────── */

function ScoreRing({ value, size = 80 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 75 ? "#22c55e" : value >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease-out" }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: size * 0.28, fontWeight: 590, fill: "#000000" }}>
        {value}
      </text>
    </svg>
  );
}

function CategoryCard({ label, score, details }: { label: string; score: number; details: string[] }) {
  return (
    <div style={{
      backgroundColor: "#ffffff",
      borderRadius: "7px",
      padding: "16px",
      boxShadow: "rgba(0, 0, 0, 0) 0px 8px 2px 0px, rgba(0, 0, 0, 0.01) 0px 5px 2px 0px, rgba(0, 0, 0, 0.04) 0px 3px 2px 0px, rgba(0, 0, 0, 0.07) 0px 1px 1px 0px, rgba(0, 0, 0, 0.08) 0px 0px 1px 0px",
    }}>
      <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
        <span style={{ fontSize: "13px", fontWeight: 590, color: "#000000" }}>{label}</span>
        <span style={{
          fontSize: "13px",
          fontWeight: 590,
          color: score >= 75 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444",
        }}>{score}%</span>
      </div>
      {/* Score bar */}
      <div style={{ height: "4px", borderRadius: "2px", backgroundColor: "#e5e7eb", marginBottom: "12px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          borderRadius: "2px",
          width: `${score}%`,
          backgroundColor: score >= 75 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444",
          transition: "width 0.8s ease-out",
        }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {details.map((d, i) => (
          <p key={i} style={{ fontSize: "12px", color: "#62666d", lineHeight: 1.5, margin: 0 }}>{d}</p>
        ))}
      </div>
    </div>
  );
}

function ColorCompare({ label, a, b }: { label: string; a: string | null; b: string | null }) {
  return (
    <div className="flex items-center" style={{ gap: "8px" }}>
      <div style={{ width: "28px", height: "28px", borderRadius: "7px", backgroundColor: a || "#e5e7eb", boxShadow: "rgba(0,0,0,0.08) 0px 0px 1px 0px" }} />
      <div style={{ width: "28px", height: "28px", borderRadius: "7px", backgroundColor: b || "#e5e7eb", boxShadow: "rgba(0,0,0,0.08) 0px 0px 1px 0px" }} />
      <span style={{ fontSize: "12px", color: "#62666d" }}>{label}</span>
    </div>
  );
}

/* ── stylescape ──────────────────────────────────────── */

interface StylescapeTokens {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  secondary: string;
  headingFont: string;
  bodyFont: string;
  radius: number;
  shadow: string;
  allColors: string[];
}

function extractStylescapeTokens(t: ScrapedTokens): StylescapeTokens {
  return {
    primary: t.colors.primary?.value ?? "#0066ff",
    background: t.colors.background?.value ?? "#f7f8f8",
    surface: t.colors.surface?.value ?? "#ffffff",
    text: t.colors.text?.value ?? "#000000",
    textMuted: t.colors.textMuted?.value ?? "#62666d",
    accent: t.colors.accent?.value ?? "#5e6ad2",
    secondary: t.colors.secondary?.value ?? "#62666d",
    headingFont: t.typography.headingFont?.family ?? "Inter",
    bodyFont: t.typography.bodyFont?.family ?? "Inter",
    radius: t.radius.dominant ?? 7,
    shadow: t.shadows[0]?.value ?? "rgba(0,0,0,0.08) 0px 0px 1px 0px",
    allColors: t.colors.allColors.slice(0, 8).map(c => c.value),
  };
}

function Stylescape({ tokens, label }: { tokens: StylescapeTokens; label: string }) {
  const r = `${tokens.radius}px`;
  const palette = [tokens.primary, tokens.accent, tokens.secondary, tokens.text, tokens.textMuted, tokens.background, tokens.surface];
  // Add unique allColors that aren't already in palette
  const extra = tokens.allColors.filter(c => !palette.includes(c));
  const fullPalette = [...palette, ...extra].slice(0, 10);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: "12px", fontWeight: 590, textTransform: "uppercase", letterSpacing: "0.05em", color: "#62666d", display: "block", marginBottom: "8px" }}>
        {label}
      </span>

      {/* Stylescape board */}
      <div style={{
        backgroundColor: tokens.background,
        borderRadius: "7px",
        overflow: "hidden",
        boxShadow: "rgba(0, 0, 0, 0) 0px 8px 2px 0px, rgba(0, 0, 0, 0.01) 0px 5px 2px 0px, rgba(0, 0, 0, 0.04) 0px 3px 2px 0px, rgba(0, 0, 0, 0.07) 0px 1px 1px 0px, rgba(0, 0, 0, 0.08) 0px 0px 1px 0px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "auto",
        gap: "1px",
      }}>

        {/* ── Row 1: Hero color block + type specimen ── */}
        <div style={{
          gridColumn: "1 / -1",
          backgroundColor: tokens.primary,
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          minHeight: "120px",
          position: "relative",
        }}>
          {/* Faint grid texture */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.06,
            backgroundImage: `linear-gradient(${tokens.surface} 1px, transparent 1px), linear-gradient(90deg, ${tokens.surface} 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }} />
          <span style={{
            fontFamily: tokens.headingFont + ", sans-serif",
            fontSize: "28px",
            fontWeight: 590,
            color: "#ffffff",
            letterSpacing: "-0.8px",
            lineHeight: 1,
            position: "relative",
          }}>
            Aa
          </span>
          <span style={{
            fontFamily: tokens.headingFont + ", sans-serif",
            fontSize: "11px",
            fontWeight: 400,
            color: "rgba(255,255,255,0.7)",
            marginTop: "4px",
            position: "relative",
          }}>
            {tokens.headingFont}
          </span>
        </div>

        {/* ── Row 2 left: Color palette strip ── */}
        <div style={{ backgroundColor: tokens.surface, padding: "16px" }}>
          <span style={{ fontSize: "9px", fontWeight: 590, textTransform: "uppercase", letterSpacing: "0.08em", color: tokens.textMuted, display: "block", marginBottom: "8px" }}>
            Palette
          </span>
          <div style={{ display: "flex", gap: "0px", borderRadius: r, overflow: "hidden" }}>
            {fullPalette.map((c, i) => (
              <div key={i} style={{ flex: 1, height: "32px", backgroundColor: c }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
            {fullPalette.slice(0, 5).map((c, i) => (
              <span key={i} style={{ fontFamily: "monospace", fontSize: "8px", color: tokens.textMuted }}>{c}</span>
            ))}
          </div>
        </div>

        {/* ── Row 2 right: Type scale ── */}
        <div style={{ backgroundColor: tokens.surface, padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "9px", fontWeight: 590, textTransform: "uppercase", letterSpacing: "0.08em", color: tokens.textMuted, marginBottom: "4px" }}>
            Type scale
          </span>
          <span style={{ fontFamily: tokens.headingFont + ", sans-serif", fontSize: "20px", fontWeight: 590, color: tokens.text, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            Display heading
          </span>
          <span style={{ fontFamily: tokens.headingFont + ", sans-serif", fontSize: "14px", fontWeight: 510, color: tokens.text, lineHeight: 1.2 }}>
            Section title
          </span>
          <span style={{ fontFamily: tokens.bodyFont + ", sans-serif", fontSize: "11px", fontWeight: 400, color: tokens.textMuted, lineHeight: 1.5 }}>
            Body text that explains things clearly and concisely to users.
          </span>
          <span style={{ fontFamily: "monospace", fontSize: "10px", color: tokens.accent, lineHeight: 1.4 }}>
            const token = &quot;monospace&quot;;
          </span>
        </div>

        {/* ── Row 3 left: UI components ── */}
        <div style={{ backgroundColor: tokens.surface, padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "9px", fontWeight: 590, textTransform: "uppercase", letterSpacing: "0.08em", color: tokens.textMuted, marginBottom: "2px" }}>
            Components
          </span>
          {/* Button primary */}
          <div style={{ padding: "7px 14px", borderRadius: r, backgroundColor: tokens.primary, color: "#ffffff", fontSize: "11px", fontWeight: 500, textAlign: "center" }}>
            Primary action
          </div>
          {/* Button secondary */}
          <div style={{ padding: "7px 14px", borderRadius: r, border: `1px solid ${tokens.textMuted}40`, color: tokens.text, fontSize: "11px", fontWeight: 500, textAlign: "center", backgroundColor: "transparent" }}>
            Secondary
          </div>
          {/* Input */}
          <div style={{ padding: "7px 10px", borderRadius: r, border: `1px solid ${tokens.textMuted}30`, backgroundColor: tokens.background, fontSize: "11px", color: tokens.textMuted }}>
            Placeholder text…
          </div>
          {/* Badge row */}
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            <span style={{ padding: "2px 8px", borderRadius: "9999px", backgroundColor: tokens.primary + "18", color: tokens.primary, fontSize: "9px", fontWeight: 510 }}>Active</span>
            <span style={{ padding: "2px 8px", borderRadius: "9999px", backgroundColor: tokens.accent + "18", color: tokens.accent, fontSize: "9px", fontWeight: 510 }}>Review</span>
            <span style={{ padding: "2px 8px", borderRadius: "9999px", backgroundColor: tokens.textMuted + "18", color: tokens.textMuted, fontSize: "9px", fontWeight: 510 }}>Draft</span>
          </div>
        </div>

        {/* ── Row 3 right: Surface + elevation ── */}
        <div style={{ backgroundColor: tokens.background, padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "9px", fontWeight: 590, textTransform: "uppercase", letterSpacing: "0.08em", color: tokens.textMuted, marginBottom: "2px" }}>
            Surfaces
          </span>
          {/* Card */}
          <div style={{ backgroundColor: tokens.surface, borderRadius: r, padding: "12px", boxShadow: tokens.shadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <div style={{ width: "16px", height: "16px", borderRadius: r, backgroundColor: tokens.primary }} />
              <span style={{ fontSize: "11px", fontWeight: 510, color: tokens.text }}>Card title</span>
            </div>
            <span style={{ fontSize: "10px", color: tokens.textMuted, lineHeight: 1.4 }}>
              Elevated surface with shadow
            </span>
          </div>
          {/* Nested card */}
          <div style={{ backgroundColor: tokens.surface, borderRadius: r, padding: "12px", boxShadow: tokens.shadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <div style={{ width: "16px", height: "16px", borderRadius: r, backgroundColor: tokens.accent }} />
              <span style={{ fontSize: "11px", fontWeight: 510, color: tokens.text }}>List item</span>
            </div>
            <div style={{ height: "1px", backgroundColor: tokens.textMuted + "20", margin: "6px 0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "16px", height: "16px", borderRadius: r, backgroundColor: tokens.secondary }} />
              <span style={{ fontSize: "11px", fontWeight: 510, color: tokens.text }}>Another item</span>
            </div>
          </div>
        </div>

        {/* ── Row 4: Radius + spacing strip ── */}
        <div style={{ gridColumn: "1 / -1", backgroundColor: tokens.surface, padding: "16px", display: "flex", gap: "24px" }}>
          {/* Radius specimens */}
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "9px", fontWeight: 590, textTransform: "uppercase", letterSpacing: "0.08em", color: tokens.textMuted, display: "block", marginBottom: "8px" }}>
              Radius — {tokens.radius}px
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              {[0, Math.max(1, Math.round(tokens.radius * 0.3)), tokens.radius, Math.round(tokens.radius * 2.5), 9999].map((rv, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <div style={{
                    width: "28px", height: "28px",
                    borderRadius: `${Math.min(rv, 14)}px`,
                    backgroundColor: tokens.primary + "15",
                    border: `1.5px solid ${tokens.primary}`,
                  }} />
                  <span style={{ fontFamily: "monospace", fontSize: "8px", color: tokens.textMuted }}>{rv === 9999 ? "full" : rv + "px"}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Spacing rhythm */}
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "9px", fontWeight: 590, textTransform: "uppercase", letterSpacing: "0.08em", color: tokens.textMuted, display: "block", marginBottom: "8px" }}>
              Spacing rhythm
            </span>
            <div style={{ display: "flex", gap: "2px", alignItems: "flex-end" }}>
              {[4, 8, 12, 16, 24, 32, 48].map((px) => (
                <div key={px} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <div style={{
                    width: "12px",
                    height: `${Math.min(px, 48)}px`,
                    borderRadius: "2px",
                    backgroundColor: tokens.accent + "30",
                    border: `1px solid ${tokens.accent}50`,
                  }} />
                  <span style={{ fontFamily: "monospace", fontSize: "7px", color: tokens.textMuted }}>{px}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── page ────────────────────────────────────────────── */

export default function ComparePage() {
  const [brandUrl, setBrandUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [brandTokens, setBrandTokens] = useState<ScrapedTokens | null>(null);
  const [targetTokens, setTargetTokens] = useState<ScrapedTokens | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const normalizeUrl = (input: string): string => {
    let u = input.trim();
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    return u;
  };

  const scrape = async (url: string): Promise<ScrapedTokens> => {
    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error("Failed to scrape " + url);
    return res.json();
  };

  const handleCompare = async () => {
    if (!brandUrl.trim() || !targetUrl.trim()) {
      setError("Please enter both URLs");
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);
    setBrandTokens(null);
    setTargetTokens(null);

    try {
      setLoadingLabel("Scraping your brand…");
      const brand = await scrape(normalizeUrl(brandUrl));
      setBrandTokens(brand);

      setLoadingLabel("Scraping comparison site…");
      const target = await scrape(normalizeUrl(targetUrl));
      setTargetTokens(target);

      setLoadingLabel("Comparing tokens…");
      const comparison = compareTokens(brand, target);
      setResult(comparison);
      setLoading(false);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      setError("Couldn't scrape one of the sites. Try different URLs.");
      setLoading(false);
    }
  };

  const overallLabel = (score: number) => {
    if (score >= 80) return "Strong match";
    if (score >= 60) return "Moderate match";
    if (score >= 40) return "Partial match";
    return "Low match";
  };

  return (
    <main className="min-h-full flex flex-col" style={{ backgroundColor: "#f7f8f8", color: "#000000" }}>
      {/* Nav */}
      <nav className="flex items-center" style={{ padding: "16px 24px", gap: "12px" }}>
        <Link href="/" className="flex items-center" style={{ gap: "8px", textDecoration: "none" }}>
          <div className="flex items-center justify-center" style={{ width: "28px", height: "28px", borderRadius: "7px", backgroundColor: "#5e6ad2" }}>
            <span className="text-white" style={{ fontSize: "12px", fontWeight: 590 }}>U</span>
          </div>
          <span style={{ fontSize: "15px", fontWeight: 590, color: "#000000" }}>uncodebase</span>
        </Link>
        <span style={{ fontSize: "13px", color: "#62666d" }}>/</span>
        <span style={{ fontSize: "13px", fontWeight: 510, color: "#62666d" }}>compare</span>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center" style={{ padding: "48px 16px 64px" }}>
        <div style={{ maxWidth: "560px", width: "100%", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
          <h1 style={{ fontSize: "48px", fontWeight: 510, letterSpacing: "-1.056px", lineHeight: 1, color: "#000000", margin: 0 }}>
            Brand comparison
          </h1>
          <p style={{ fontSize: "15px", fontWeight: 400, letterSpacing: "-0.165px", lineHeight: 1.6, color: "#62666d", maxWidth: "400px", margin: 0 }}>
            Compare any site against your brand. See how closely the design tokens match.
          </p>

          {/* Inputs */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            <div style={{
              backgroundColor: "#ffffff",
              borderRadius: "7px",
              padding: "4px",
              boxShadow: "rgba(0, 0, 0, 0) 0px 8px 2px 0px, rgba(0, 0, 0, 0.01) 0px 5px 2px 0px, rgba(0, 0, 0, 0.04) 0px 3px 2px 0px, rgba(0, 0, 0, 0.07) 0px 1px 1px 0px, rgba(0, 0, 0, 0.08) 0px 0px 1px 0px",
            }}>
              <div className="flex items-center" style={{ gap: "8px", padding: "0 12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 590, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>Your brand</span>
                <input
                  type="text"
                  value={brandUrl}
                  onChange={(e) => { setBrandUrl(e.target.value); setError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCompare(); }}
                  placeholder="https://yourcompany.com"
                  disabled={loading}
                  className="focus:outline-none"
                  style={{
                    flex: 1, height: "40px", padding: "8px 0", fontSize: "15px", fontWeight: 400,
                    letterSpacing: "-0.165px", color: "#000000", backgroundColor: "transparent",
                    border: "none", opacity: loading ? 0.5 : 1,
                  }}
                />
              </div>
            </div>

            <div style={{
              backgroundColor: "#ffffff",
              borderRadius: "7px",
              padding: "4px",
              boxShadow: "rgba(0, 0, 0, 0) 0px 8px 2px 0px, rgba(0, 0, 0, 0.01) 0px 5px 2px 0px, rgba(0, 0, 0, 0.04) 0px 3px 2px 0px, rgba(0, 0, 0, 0.07) 0px 1px 1px 0px, rgba(0, 0, 0, 0.08) 0px 0px 1px 0px",
            }}>
              <div className="flex items-center" style={{ gap: "8px", padding: "0 12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 590, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>Compare to</span>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => { setTargetUrl(e.target.value); setError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCompare(); }}
                  placeholder="https://othersite.com"
                  disabled={loading}
                  className="focus:outline-none"
                  style={{
                    flex: 1, height: "40px", padding: "8px 0", fontSize: "15px", fontWeight: 400,
                    letterSpacing: "-0.165px", color: "#000000", backgroundColor: "transparent",
                    border: "none", opacity: loading ? 0.5 : 1,
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleCompare}
              disabled={loading}
              className="cursor-pointer active:scale-[0.98] transition-transform"
              style={{
                width: "100%", height: "40px", fontSize: "15px", fontWeight: 500,
                color: "#ffffff", backgroundColor: "#0066ff", border: "none",
                borderRadius: "7px", opacity: loading ? 0.7 : 1, marginTop: "4px",
              }}
            >
              {loading ? "Comparing…" : "Compare brands"}
            </button>
          </div>

          {error && <p style={{ fontSize: "13px", fontWeight: 500, color: "#ef4444", margin: 0 }}>{error}</p>}

          {loading && (
            <div className="flex items-center" style={{ gap: "12px" }}>
              <div className="relative" style={{ width: "16px", height: "16px" }}>
                <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "#5e6ad2", borderTopColor: "transparent" }} />
              </div>
              <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "13px", color: "#62666d" }}>
                {loadingLabel}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {result && brandTokens && targetTokens && (
        <section ref={resultRef} style={{ padding: "0 16px 64px" }}>
          <div style={{ maxWidth: "640px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Overall score */}
            <div className="flex flex-col items-center" style={{
              backgroundColor: "#ffffff", borderRadius: "7px", padding: "32px 24px",
              boxShadow: "rgba(0, 0, 0, 0) 0px 8px 2px 0px, rgba(0, 0, 0, 0.01) 0px 5px 2px 0px, rgba(0, 0, 0, 0.04) 0px 3px 2px 0px, rgba(0, 0, 0, 0.07) 0px 1px 1px 0px, rgba(0, 0, 0, 0.08) 0px 0px 1px 0px",
              gap: "12px",
            }}>
              <ScoreRing value={result.overall} size={96} />
              <span style={{ fontSize: "20px", fontWeight: 590, letterSpacing: "-0.24px", color: "#000000" }}>
                {overallLabel(result.overall)}
              </span>
              <p style={{ fontSize: "13px", color: "#62666d", margin: 0 }}>
                <span style={{ fontWeight: 510 }}>{brandTokens.domain}</span>
                {" vs "}
                <span style={{ fontWeight: 510 }}>{targetTokens.domain}</span>
              </p>
            </div>

            {/* Color swatches side-by-side */}
            <div style={{
              backgroundColor: "#ffffff", borderRadius: "7px", padding: "16px",
              boxShadow: "rgba(0, 0, 0, 0) 0px 8px 2px 0px, rgba(0, 0, 0, 0.01) 0px 5px 2px 0px, rgba(0, 0, 0, 0.04) 0px 3px 2px 0px, rgba(0, 0, 0, 0.07) 0px 1px 1px 0px, rgba(0, 0, 0, 0.08) 0px 0px 1px 0px",
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 590, textTransform: "uppercase", letterSpacing: "0.05em", color: "#62666d" }}>Color tokens</span>
                <div className="flex items-center" style={{ gap: "12px", fontSize: "11px", color: "#62666d" }}>
                  <span style={{ fontWeight: 510 }}>{brandTokens.domain}</span>
                  <span style={{ fontWeight: 510 }}>{targetTokens.domain}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                <ColorCompare label="Primary" a={brandTokens.colors.primary?.value ?? null} b={targetTokens.colors.primary?.value ?? null} />
                <ColorCompare label="Background" a={brandTokens.colors.background?.value ?? null} b={targetTokens.colors.background?.value ?? null} />
                <ColorCompare label="Text" a={brandTokens.colors.text?.value ?? null} b={targetTokens.colors.text?.value ?? null} />
                <ColorCompare label="Accent" a={brandTokens.colors.accent?.value ?? null} b={targetTokens.colors.accent?.value ?? null} />
                <ColorCompare label="Surface" a={brandTokens.colors.surface?.value ?? null} b={targetTokens.colors.surface?.value ?? null} />
              </div>
            </div>

            {/* Category breakdowns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <CategoryCard label="Colors" score={result.colors.score} details={result.colors.details} />
              <CategoryCard label="Typography" score={result.typography.score} details={result.typography.details} />
              <CategoryCard label="Spacing" score={result.spacing.score} details={result.spacing.details} />
              <CategoryCard label="Border Radius" score={result.radius.score} details={result.radius.details} />
            </div>

            {/* Stylescapes — side by side */}
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 590, letterSpacing: "-0.24px", lineHeight: 1.33, color: "#000000", margin: "0 0 4px" }}>
                Stylescape
              </h2>
              <p style={{ fontSize: "13px", color: "#62666d", margin: "0 0 16px" }}>
                Visual identity of each brand — colors, type, components, and surfaces side by side.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <Stylescape tokens={extractStylescapeTokens(brandTokens)} label={brandTokens.domain} />
                <Stylescape tokens={extractStylescapeTokens(targetTokens)} label={targetTokens.domain} />
              </div>
            </div>

            {/* Hybrid stylescape — your brand in their style */}
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 590, letterSpacing: "-0.24px", lineHeight: 1.33, color: "#000000", margin: "0 0 4px" }}>
                Your brand, their style
              </h2>
              <p style={{ fontSize: "13px", color: "#62666d", margin: "0 0 16px" }}>
                Your brand color placed into <span style={{ fontWeight: 510 }}>{targetTokens.domain}</span>&apos;s design system.
              </p>
              <Stylescape
                tokens={{
                  ...extractStylescapeTokens(targetTokens),
                  primary: brandTokens.colors.primary?.value ?? extractStylescapeTokens(targetTokens).primary,
                }}
                label={`${brandTokens.domain} × ${targetTokens.domain}`}
              />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
