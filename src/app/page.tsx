"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
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

  const ColorSwatch = ({ label, token, usage }: { label: string; token: { value: string; source: string } | null; usage: string }) => (
    <div className="flex items-center gap-3 py-2">
      <div
        className="w-10 h-10 shrink-0"
        style={{ backgroundColor: token?.value || "#cccccc", borderRadius: "7px", boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 1px 0px" }}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm" style={{ color: "#000000" }}>{label}</span>
          <span className="font-mono text-xs" style={{ color: "#62666d" }}>{token?.value || "—"}</span>
        </div>
        <span className="text-xs" style={{ color: "#62666d" }}>{usage}</span>
        {token?.source && (
          <span className="text-[10px] ml-1" style={{ color: "#62666d80" }}>({token.source.split(",")[0]})</span>
        )}
      </div>
    </div>
  );

  const SuggestionBadge = ({ s }: { s: AnalyzerSuggestion }) => {
    const colors = {
      warning: { bg: "#fef3c7", text: "#92400e", icon: "!" },
      info: { bg: "#dbeafe", text: "#1e40af", icon: "i" },
      improvement: { bg: "#f0fdf4", text: "#166534", icon: "+" },
    };
    const c = colors[s.type];
    return (
      <div className="flex items-start gap-2 text-xs p-2.5" style={{ backgroundColor: c.bg, color: c.text, borderRadius: "7px" }}>
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
          style={{ backgroundColor: c.text + "20" }}>
          {c.icon}
        </span>
        {s.message}
      </div>
    );
  };

  return (
    <main className="min-h-full flex flex-col" style={{ backgroundColor: "#f7f8f8", color: "#000000" }}>
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-12">
        <div className="max-w-2xl w-full mx-auto text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-[7px] flex items-center justify-center" style={{ backgroundColor: "#0066ff" }}>
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-lg tracking-tight" style={{ color: "#000000", fontWeight: 590 }}>uncodebase</span>
          </div>

          <h1 className="text-5xl sm:text-[64px] leading-none" style={{ color: "#000000", fontWeight: 510, letterSpacing: "-1.408px" }}>
            Close the design-to-AI gap
          </h1>
          <p className="text-lg sm:text-xl max-w-lg mx-auto" style={{ color: "#62666d", fontWeight: 400, letterSpacing: "-0.165px", lineHeight: 1.6 }}>
            Paste your site. Extract your tokens. Generate components that match your brand.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleExtract(); }}
                placeholder="https://yoursite.com"
                disabled={loading}
                className="w-full h-14 px-5 text-base border transition-all placeholder:text-[#62666d80] disabled:opacity-50 focus:outline-none"
                style={{
                  borderColor: error ? "#ef4444" : "#62666d",
                  color: "#000000",
                  backgroundColor: "#f9fafb",
                  borderRadius: "7px",
                  borderWidth: "1px",
                }}
                onFocus={(e) => { if (!error) e.currentTarget.style.boxShadow = "rgba(0, 102, 255, 0.3) 0px 0px 0px 2px"; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <button
              onClick={handleExtract}
              disabled={loading}
              className="h-14 px-8 text-white text-base transition-all cursor-pointer disabled:opacity-50 shrink-0 hover:brightness-90 active:scale-[0.98]"
              style={{ backgroundColor: "#0066ff", borderRadius: "7px", fontWeight: 500 }}
            >
              {loading ? "Extracting..." : "Extract tokens"}
            </button>
          </div>

          {error && <p className="text-sm" style={{ color: "#ef4444", fontWeight: 500 }}>{error}</p>}

          {loading && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: "#0066ff", borderTopColor: "transparent" }} />
                </div>
                <span className="text-sm tracking-wide"
                  style={{ fontFamily: "var(--font-space-mono), monospace", color: "#62666d" }}>
                  {LOADING_STEPS[loadingStep]}
                </span>
              </div>
              <div className="w-64 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#e5e7eb" }}>
                <div className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ backgroundColor: "#0066ff", width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }} />
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
                <h2 className="text-2xl" style={{ color: "#000000", fontWeight: 510, letterSpacing: "-0.24px" }}>Design tokens extracted</h2>
                <p className="text-sm mt-1" style={{ color: "#62666d" }}>
                  {tokens.domain}
                  {tokens.platform.name !== "generic" && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs"
                      style={{ backgroundColor: "#5e6ad2", color: "#ffffff", fontWeight: 510 }}>
                      {tokens.platform.name}
                    </span>
                  )}
                </p>
              </div>
              <button onClick={handleCopy}
                className="h-11 px-6 text-white text-sm transition-all cursor-pointer hover:brightness-90 active:scale-[0.98] flex items-center gap-2"
                style={{ backgroundColor: copied ? "#5e6ad2" : "#0066ff", borderRadius: "7px", fontWeight: 500 }}>
                {copied ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="white" strokeWidth="1.5" /><path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="white" strokeWidth="1.5" /></svg>
                    Copy design.md
                  </>
                )}
              </button>
            </div>

            {copied && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 text-sm z-50 flex items-center gap-2"
                style={{ backgroundColor: "#000000", color: "#ffffff", borderRadius: "7px", fontWeight: 500, boxShadow: "rgba(0, 0, 0, 0) 0px 8px 2px 0px, rgba(0, 0, 0, 0.01) 0px 5px 2px 0px, rgba(0, 0, 0, 0.04) 0px 3px 2px 0px, rgba(0, 0, 0, 0.07) 0px 1px 1px 0px, rgba(0, 0, 0, 0.08) 0px 0px 1px 0px" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#5e6ad2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
            <div className="overflow-hidden" style={{ backgroundColor: "#f9fafb", borderRadius: "7px", boxShadow: "rgba(0, 0, 0, 0) 0px 8px 2px 0px, rgba(0, 0, 0, 0.01) 0px 5px 2px 0px, rgba(0, 0, 0, 0.04) 0px 3px 2px 0px, rgba(0, 0, 0, 0.07) 0px 1px 1px 0px, rgba(0, 0, 0, 0.08) 0px 0px 1px 0px" }}>
              <div className="flex border-b" style={{ borderColor: "#e5e7eb" }}>
                {([ { key: "preview" as TabKey, label: "Preview" }, { key: "markdown" as TabKey, label: "design.md" }, { key: "json" as TabKey, label: "JSON" } ]).map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className="px-6 py-3 text-sm transition-colors cursor-pointer relative"
                    style={{ color: activeTab === tab.key ? "#0066ff" : "#62666d", fontWeight: activeTab === tab.key ? 510 : 400 }}>
                    {tab.label}
                    {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: "#0066ff" }} />}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === "preview" && (
                  <div className="space-y-8">
                    {/* Colors */}
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#62666d" }}>Colors</h3>
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
                          <summary className="text-xs font-medium cursor-pointer" style={{ color: "#62666d" }}>
                            {tokens.colors.allColors.length} colors discovered (deduped)
                          </summary>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {tokens.colors.allColors.slice(0, 20).map((c, i) => (
                              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs" style={{ backgroundColor: "#f9fafb" }}>
                                <div className="w-4 h-4 rounded border" style={{ backgroundColor: c.value, borderColor: "#e5e7eb" }} />
                                <span className="font-mono">{c.value}</span>
                                <span style={{ color: "#62666d" }}>×{c.count}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>

                    {/* Typography */}
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#62666d" }}>Typography</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 rounded-xl" style={{ backgroundColor: "#f9fafb" }}>
                          <span className="text-xs uppercase tracking-wider" style={{ color: "#62666d" }}>Heading</span>
                          <p className="text-lg font-semibold mt-1">{tokens.typography.headingFont?.family || "Not detected"}</p>
                          {tokens.typography.headingFont?.weights && (
                            <p className="text-xs mt-1" style={{ color: "#62666d" }}>Weights: {tokens.typography.headingFont.weights.join(", ")}</p>
                          )}
                        </div>
                        <div className="p-4 rounded-xl" style={{ backgroundColor: "#f9fafb" }}>
                          <span className="text-xs uppercase tracking-wider" style={{ color: "#62666d" }}>Body</span>
                          <p className="text-lg font-semibold mt-1">{tokens.typography.bodyFont?.family || "Not detected"}</p>
                          {tokens.typography.bodyFont?.weights && (
                            <p className="text-xs mt-1" style={{ color: "#62666d" }}>Weights: {tokens.typography.bodyFont.weights.join(", ")}</p>
                          )}
                        </div>
                      </div>
                      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ backgroundColor: "#f9fafb" }}>
                              <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "#62666d" }}>Element</th>
                              <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "#62666d" }}>Size</th>
                              <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "#62666d" }}>Weight</th>
                              <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "#62666d" }}>Line Height</th>
                              <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "#62666d" }}>Preview</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tokens.typography.scale.map((entry, i) => (
                              <tr key={i} className="border-t" style={{ borderColor: "#e5e7eb" }}>
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
                      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#62666d" }}>
                        Spacing &middot; Base unit: {tokens.spacing.baseUnit ?? "?"}px
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {tokens.spacing.values.slice(0, 12).map((px, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="rounded-sm shrink-0"
                              style={{ width: Math.min(px, 80), height: 24, backgroundColor: "#0066ff20", border: "1px solid #0066ff40" }} />
                            <span className="font-mono text-xs" style={{ color: "#62666d" }}>{px}px</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Border Radius */}
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#62666d" }}>Border Radius</h3>
                      <div className="flex gap-6">
                        {[
                          { label: "sm", value: tokens.radius.small },
                          { label: "md", value: tokens.radius.medium },
                          { label: "lg", value: tokens.radius.large },
                          { label: "full", value: 9999 },
                        ].map((r) => (
                          <div key={r.label} className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 border-2"
                              style={{ borderColor: "#0066ff", backgroundColor: "#0066ff10", borderRadius: r.value != null ? `${r.value}px` : "0px" }} />
                            <div className="text-center">
                              <span className="font-mono text-xs block" style={{ color: "#000000" }}>{r.label}</span>
                              <span className="font-mono text-[10px]" style={{ color: "#62666d" }}>
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
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#62666d" }}>Shadows</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {tokens.shadows.slice(0, 4).map((s, i) => (
                            <div key={i} className="p-4 rounded-xl bg-white" style={{ boxShadow: s.value }}>
                              <span className="font-mono text-[10px] break-all" style={{ color: "#62666d" }}>{s.value}</span>
                              <p className="text-xs mt-1" style={{ color: "#62666d80" }}>Found on: {s.source}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "markdown" && (
                  <pre className="overflow-auto max-h-[600px] text-sm leading-relaxed p-4 rounded-xl"
                    style={{ fontFamily: "var(--font-space-mono), monospace", backgroundColor: "#1a1b25", color: "#f7f8f8" }}>
                    {designMd}
                  </pre>
                )}

                {activeTab === "json" && (
                  <pre className="overflow-auto max-h-[600px] text-sm leading-relaxed p-4 rounded-xl"
                    style={{ fontFamily: "var(--font-space-mono), monospace", backgroundColor: "#1a1b25", color: "#f7f8f8" }}>
                    {JSON.stringify(tokens, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="pb-12 pt-4 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm mb-4" style={{ color: "#62666d" }}>Works with</p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {[
              { name: "Claude", src: "/claude_logo.png" },
              { name: "Cursor", src: "/cursor_logo.png" },
              { name: "ChatGPT", src: "/chatgpt_logo.jpg" },
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#f9fafb" }}>
                <Image src={tool.src} alt={tool.name} width={20} height={20} className="rounded-sm" />
                <span className="text-sm font-medium" style={{ color: "#000000" }}>{tool.name}</span>
              </div>
            ))}
            {["v0", "Bolt", "Lovable"].map((name) => (
              <div key={name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#f9fafb" }}>
                <span className="text-sm font-medium" style={{ color: "#000000" }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
