"use client";

import { useState, useRef, useEffect } from "react";
import type { ScrapedTokens } from "@/lib/scrape-types";
import { generateDesignMd } from "@/lib/generator";
import { analyzeTokens, type AnalyzerSuggestion } from "@/lib/analyzer";

const LOADING_STEPS = [
  "Identifying your website stack...",
  "Extracting color tokens...",
  "Analyzing typography...",
  "Mapping spacing scale...",
  "Detecting shadows & radius...",
  "Generating your design.md...",
];

type TabKey = "preview" | "markdown" | "json";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<ScrapedTokens | null>(null);
  const [designMd, setDesignMd] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AnalyzerSuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("preview");
  const [copied, setCopied] = useState(false);
  const [copiedTab, setCopiedTab] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const loadingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (loadingInterval.current) clearInterval(loadingInterval.current); };
  }, []);

  const validateUrl = (input: string): string | null => {
    let u = input.trim();
    if (!u) return "Please enter a valid URL";
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    try {
      const parsed = new URL(u);
      if (!["http:", "https:"].includes(parsed.protocol)) return "Please enter a valid URL";
      return null;
    } catch { return "Please enter a valid URL"; }
  };

  const normalizeUrl = (input: string): string => {
    let u = input.trim();
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    return u;
  };

  const handleExtract = async () => {
    const validationError = validateUrl(url);
    if (validationError) { setError(validationError); return; }

    setError(null); setLoading(true); setLoadingStep(0);
    setTokens(null); setDesignMd(null); setSuggestions([]);

    let step = 0;
    loadingInterval.current = setInterval(() => {
      step = Math.min(step + 1, LOADING_STEPS.length - 1);
      setLoadingStep(step);
    }, 2200);

    try {
      const normalizedUrl = normalizeUrl(url);
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (loadingInterval.current) clearInterval(loadingInterval.current);

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.error || "";
        if (msg.includes("timeout") || msg.includes("Timeout")) {
          setError("That site took too long. Try a simpler page.");
        } else {
          setError("Couldn't access that site. Try another URL.");
        }
        setLoading(false); return;
      }

      const data: ScrapedTokens = await res.json();
      setTokens(data);
      setDesignMd(generateDesignMd(data, normalizedUrl));
      setSuggestions(analyzeTokens(data));
      setActiveTab("preview");
      setLoading(false);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
      setError("Couldn't access that site. Try another URL.");
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!designMd) return;
    try {
      await navigator.clipboard.writeText(designMd);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = designMd; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyTab = async () => {
    const content = activeTab === "markdown" ? designMd : activeTab === "json" ? JSON.stringify(tokens, null, 2) : null;
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedTab(true); setTimeout(() => setCopiedTab(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = content; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      setCopiedTab(true); setTimeout(() => setCopiedTab(false), 2500);
    }
  };

  const ColorSwatch = ({ label, token, usage }: { label: string; token: { value: string; source: string } | null; usage: string }) => (
    <div className="flex items-center gap-3 py-2">
      <div
        className="w-10 h-10 shrink-0"
        style={{ backgroundColor: token?.value || "#cccccc", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)" }}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm" style={{ color: "#f7f8f8" }}>{label}</span>
          <span className="font-mono text-xs" style={{ color: "#8a8f98" }}>{token?.value || "—"}</span>
        </div>
        <span className="text-xs" style={{ color: "#8a8f98" }}>{usage}</span>
        {token?.source && (
          <span className="text-[10px] ml-1" style={{ color: "#8a8f9880" }}>({token.source.split(",")[0]})</span>
        )}
      </div>
    </div>
  );

  const SuggestionBadge = ({ s }: { s: AnalyzerSuggestion }) => {
    const colors = {
      warning: { bg: "#3a2a00", text: "#fbbf24", icon: "!" },
      info: { bg: "#0a1a3a", text: "#60a5fa", icon: "i" },
      improvement: { bg: "#0a2a1a", text: "#4ade80", icon: "+" },
    };
    const c = colors[s.type];
    return (
      <div className="flex items-start gap-2 text-xs p-2.5" style={{ backgroundColor: c.bg, color: c.text, borderRadius: "8px", border: "1px solid " + c.text + "30" }}>
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
          style={{ backgroundColor: c.text + "20" }}>
          {c.icon}
        </span>
        {s.message}
      </div>
    );
  };

  return (
    <main className="min-h-full flex flex-col" style={{ backgroundColor: "#191a1f", color: "#f7f8f8" }}>
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-16">
        <div className="max-w-2xl w-full mx-auto text-center" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
          <h1 style={{ fontSize: "56px", fontWeight: 400, letterSpacing: "-1.4px", lineHeight: 1.1, color: "#f7f8f8", margin: 0 }}>
            Close the design‑to‑AI gap
          </h1>
          <p style={{ fontSize: "15px", fontWeight: 400, letterSpacing: "-0.165px", lineHeight: 1.6, color: "#8a8f98", maxWidth: "420px", margin: 0 }}>
            Paste your site. Extract your tokens. Generate components that match your brand.
          </p>

          {/* Search bar */}
          <div style={{ marginTop: "8px", width: "100%", maxWidth: "520px" }}>
            <div
              className="flex items-center"
              style={{
                backgroundColor: "#1e1f25",
                borderRadius: "8px",
                border: error ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.06)",
                padding: "4px",
                boxShadow: "rgba(0, 0, 0, 0.3) 0px 2px 8px",
              }}
            >
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleExtract(); }}
                placeholder="https://yoursite.com"
                disabled={loading}
                className="focus:outline-none"
                style={{
                  flex: 1,
                  height: "40px",
                  padding: "8px 16px",
                  fontSize: "15px",
                  fontWeight: 400,
                  letterSpacing: "-0.165px",
                  color: "#f7f8f8",
                  backgroundColor: "transparent",
                  border: "none",
                  opacity: loading ? 0.5 : 1,
                }}
              />
              <button
                onClick={handleExtract}
                disabled={loading}
                className="cursor-pointer shrink-0 active:scale-[0.98]"
                style={{
                  height: "40px",
                  padding: "8px 16px",
                  fontSize: "15px",
                  fontWeight: 510,
                  color: "#ffffff",
                  backgroundColor: "#5e6ad2",
                  border: "none",
                  borderRadius: "8px",
                  opacity: loading ? 0.7 : 1,
                  transition: "background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
              >
                {loading ? "Extracting…" : "Extract tokens"}
              </button>
            </div>
          </div>

          {error && <p style={{ fontSize: "13px", fontWeight: 510, color: "#ef4444", margin: 0 }}>{error}</p>}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginTop: "8px" }}>
              <div className="flex items-center gap-3">
                <div className="relative" style={{ width: "16px", height: "16px" }}>
                  <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: "#5e6ad2", borderTopColor: "transparent" }} />
                </div>
                <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#8a8f98" }}>
                  {LOADING_STEPS[loadingStep]}
                </span>
              </div>
              <div style={{ width: "240px", height: "2px", borderRadius: "4px", backgroundColor: "#e5e7eb", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  borderRadius: "4px",
                  backgroundColor: "#5e6ad2",
                  width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%`,
                  transition: "width 0.7s ease-out",
                }} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {tokens && designMd && (
        <section ref={resultRef} className="px-4 pb-16">
          <div className="max-w-4xl w-full mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 style={{ fontSize: "40px", fontWeight: 510, letterSpacing: "-0.8px", lineHeight: 1.1, color: "#f7f8f8" }}>Design tokens extracted</h2>
                <p style={{ fontSize: "13px", color: "#8a8f98", marginTop: "4px" }}>
                  {tokens.domain}
                  {tokens.platform.name !== "generic" && (
                    <span style={{ marginLeft: "8px", padding: "2px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 510, backgroundColor: "#5e6ad2", color: "#ffffff" }}>
                      {tokens.platform.name}
                    </span>
                  )}
                </p>
              </div>
              <button onClick={handleCopy}
                className="cursor-pointer active:scale-[0.98] flex items-center gap-2"
                style={{ height: "36px", padding: "8px 16px", fontSize: "13px", fontWeight: 510, color: "#ffffff", backgroundColor: copied ? "#5e6ad2" : "#000000", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", transition: "background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="#ffffff" strokeWidth="1.5" /><path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="#ffffff" strokeWidth="1.5" /></svg>
                    Copy design.md
                  </>
                )}
              </button>
            </div>

            {copied && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2"
                style={{ padding: "8px 16px", fontSize: "13px", fontWeight: 510, color: "#ffffff", backgroundColor: "#000000", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "rgba(0, 0, 0, 0.3) 0px 2px 8px" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#5e6ad2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Copied! Paste into Claude or Cursor.
              </div>
            )}

            {/* Analyzer suggestions */}
            {suggestions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.slice(0, 6).map((s, i) => <SuggestionBadge key={i} s={s} />)}
              </div>
            )}

            {/* Tabs */}
            <div className="overflow-hidden" style={{ backgroundColor: "#1e1f25", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "rgba(0, 0, 0, 0.3) 0px 2px 8px" }}>
              <div className="flex items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex flex-1">
                  {([ { key: "preview" as TabKey, label: "Preview" }, { key: "markdown" as TabKey, label: "design.md" }, { key: "json" as TabKey, label: "JSON" } ]).map((tab) => (
                    <button key={tab.key} onClick={() => { setActiveTab(tab.key); setCopiedTab(false); }}
                      className="cursor-pointer relative"
                      style={{ padding: "8px 16px", fontSize: "13px", color: activeTab === tab.key ? "#000000" : "#62666d", fontWeight: activeTab === tab.key ? 510 : 400, transition: "color 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>
                      {tab.label}
                      {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0" style={{ height: "2px", backgroundColor: "#5e6ad2" }} />}
                    </button>
                  ))}
                </div>
                {activeTab !== "preview" && (
                  <button onClick={handleCopyTab}
                    className="cursor-pointer active:scale-[0.98] flex items-center gap-1.5"
                    style={{ marginRight: "8px", padding: "4px 12px", fontSize: "12px", fontWeight: 510, color: copiedTab ? "#ffffff" : "#62666d", backgroundColor: copiedTab ? "#5e6ad2" : "transparent", borderRadius: "8px", border: copiedTab ? "1px solid #5e6ad2" : "1px solid #62666d30", transition: "background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>
                    {copiedTab ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5" /></svg>
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>

              <div style={{ padding: "24px" }}>
                {activeTab === "preview" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                    {/* Colors */}
                    <div>
                      <h3 style={{ fontSize: "12px", fontWeight: 510, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8a8f98", marginBottom: "16px" }}>Colors</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                        <ColorSwatch label="--color-primary" token={tokens.colors.primary} usage="Actions, links" />
                        <ColorSwatch label="--color-secondary" token={tokens.colors.secondary} usage="Muted elements" />
                        <ColorSwatch label="--color-accent" token={tokens.colors.accent} usage="Highlights, badges" />
                        <ColorSwatch label="--color-background" token={tokens.colors.background} usage="Page background" />
                        <ColorSwatch label="--color-surface" token={tokens.colors.surface} usage="Cards, modals" />
                        <ColorSwatch label="--color-text" token={tokens.colors.text} usage="Primary text" />
                        <ColorSwatch label="--color-text-muted" token={tokens.colors.textMuted} usage="Captions, secondary" />
                      </div>
                      {tokens.colors.allColors.length > 6 && (
                        <details className="mt-4">
                          <summary className="text-xs font-medium cursor-pointer" style={{ color: "#8a8f98" }}>
                            {tokens.colors.allColors.length} colors discovered (deduped)
                          </summary>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {tokens.colors.allColors.slice(0, 20).map((c, i) => (
                              <div key={i} className="flex items-center gap-1.5 px-2 py-1 text-xs" style={{ backgroundColor: "#25262d", borderRadius: "8px" }}>
                                <div className="w-4 h-4" style={{ backgroundColor: c.value, borderRadius: "4px", border: "1px solid rgba(255,255,255,0.06)" }} />
                                <span className="font-mono">{c.value}</span>
                                <span style={{ color: "#8a8f98" }}>×{c.count}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>

                    {/* Typography */}
                    <div>
                      <h3 style={{ fontSize: "12px", fontWeight: 510, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8a8f98", marginBottom: "16px" }}>Typography</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                        <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#25262d" }}>
                          <span style={{ fontSize: "11px", fontWeight: 510, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8a8f98" }}>Heading</span>
                          <p style={{ fontSize: "15px", fontWeight: 510, marginTop: "4px", color: "#f7f8f8" }}>{tokens.typography.headingFont?.family || "Not detected"}</p>
                          {tokens.typography.headingFont?.weights && (
                            <p style={{ fontSize: "12px", marginTop: "4px", color: "#8a8f98" }}>Weights: {tokens.typography.headingFont.weights.join(", ")}</p>
                          )}
                        </div>
                        <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#25262d" }}>
                          <span style={{ fontSize: "11px", fontWeight: 510, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8a8f98" }}>Body</span>
                          <p style={{ fontSize: "15px", fontWeight: 510, marginTop: "4px", color: "#f7f8f8" }}>{tokens.typography.bodyFont?.family || "Not detected"}</p>
                          {tokens.typography.bodyFont?.weights && (
                            <p style={{ fontSize: "12px", marginTop: "4px", color: "#8a8f98" }}>Weights: {tokens.typography.bodyFont.weights.join(", ")}</p>
                          )}
                        </div>
                      </div>
                      <div className="overflow-hidden" style={{ borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ backgroundColor: "#25262d" }}>
                              <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "#8a8f98" }}>Element</th>
                              <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "#8a8f98" }}>Size</th>
                              <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "#8a8f98" }}>Weight</th>
                              <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "#8a8f98" }}>Line Height</th>
                              <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "#8a8f98" }}>Preview</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tokens.typography.scale.map((entry, i) => (
                              <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                <td className="px-3 py-2 font-mono text-xs">{entry.element}</td>
                                <td className="px-3 py-2 font-mono text-xs">{entry.size}px</td>
                                <td className="px-3 py-2 font-mono text-xs">{entry.weight}</td>
                                <td className="px-3 py-2 font-mono text-xs">{entry.lineHeight}</td>
                                <td className="px-3 py-2">
                                  <span style={{ fontSize: Math.min(entry.size, 36), fontWeight: entry.weight, lineHeight: 1.2 }}>Aa</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Spacing */}
                    <div>
                      <h3 style={{ fontSize: "12px", fontWeight: 510, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8a8f98", marginBottom: "16px" }}>
                        Spacing &middot; Base unit: {tokens.spacing.baseUnit ?? "?"}px
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {tokens.spacing.values.slice(0, 12).map((px, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="shrink-0"
                              style={{ width: Math.min(px, 80), height: 24, backgroundColor: "#5e6ad220", border: "1px solid #5e6ad240", borderRadius: "4px" }} />
                            <span className="font-mono text-xs" style={{ color: "#8a8f98" }}>{px}px</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Border Radius */}
                    <div>
                      <h3 style={{ fontSize: "12px", fontWeight: 510, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8a8f98", marginBottom: "16px" }}>Border Radius</h3>
                      <div className="flex gap-6">
                        {[
                          { label: "sm", value: tokens.radius.small },
                          { label: "md", value: tokens.radius.medium },
                          { label: "lg", value: tokens.radius.large },
                          { label: "full", value: 9999 },
                        ].map((r) => (
                          <div key={r.label} className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14"
                              style={{ border: "2px solid #5e6ad2", backgroundColor: "#5e6ad210", borderRadius: r.value != null ? `${r.value}px` : "0px" }} />
                            <div className="text-center">
                              <span className="font-mono text-xs block" style={{ color: "#f7f8f8" }}>{r.label}</span>
                              <span className="font-mono text-[10px]" style={{ color: "#8a8f98" }}>
                                {r.value != null ? `${r.value}px` : "—"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shadows */}
                    {tokens.shadows.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: "12px", fontWeight: 510, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8a8f98", marginBottom: "16px" }}>Shadows</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {tokens.shadows.slice(0, 4).map((s, i) => (
                            <div key={i} className="p-4" style={{ borderRadius: "8px", backgroundColor: "#25262d", border: "1px solid rgba(255,255,255,0.06)", boxShadow: s.value }}>
                              <span className="font-mono text-[10px] break-all" style={{ color: "#8a8f98" }}>{s.value}</span>
                              <p className="text-xs mt-1" style={{ color: "#8a8f9880" }}>Found on: {s.source}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "markdown" && (
                  <pre className="overflow-auto max-h-[600px] text-sm leading-relaxed p-4"
                    style={{ fontFamily: "monospace", backgroundColor: "#000000", color: "#f7f8f8", borderRadius: "8px" }}>
                    {designMd}
                  </pre>
                )}

                {activeTab === "json" && (
                  <pre className="overflow-auto max-h-[600px] text-sm leading-relaxed p-4"
                    style={{ fontFamily: "monospace", backgroundColor: "#000000", color: "#f7f8f8", borderRadius: "8px" }}>
                    {JSON.stringify(tokens, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ paddingBottom: "48px", paddingTop: "16px", paddingLeft: "16px", paddingRight: "16px" }}>
        <div style={{ maxWidth: "520px", margin: "0 auto", textAlign: "center" }}>
          {/* Author */}
          <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-center" style={{ gap: "8px", fontSize: "13px", color: "#8a8f98", lineHeight: 1.6 }}>
              <span>A project by</span>
              <span style={{ fontWeight: 510, color: "#f7f8f8" }}>Rick Bossenbroek</span>
              <a
                href="https://www.linkedin.com/in/rick-bossenbroek/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
                style={{ color: "#8a8f98", textDecoration: "none", transition: "color 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#5e6ad2"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#62666d"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a
                href="https://x.com/rickbossenbroek"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
                style={{ color: "#8a8f98", textDecoration: "none", transition: "color 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#000000"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#62666d"}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
