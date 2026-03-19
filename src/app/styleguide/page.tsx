"use client";

import { useState, useRef, useEffect } from "react";
import type { ScrapedTokens } from "@/lib/scrape-types";

const LOADING_STEPS = [
  "Identifying your website stack...",
  "Extracting color tokens...",
  "Analyzing typography...",
  "Mapping spacing scale...",
  "Detecting shadows & radius...",
  "Building your styleguide...",
];

type TabKey = "atoms" | "molecules" | "organisms" | "tokens";

// ── Helper: extract design tokens as CSS variables from scraped data ──
function buildTokenVars(tokens: ScrapedTokens): Record<string, string> {
  const v = (t: { value: string } | null, fb: string) => t?.value ?? fb;
  const base = tokens.spacing.baseUnit ?? 4;
  return {
    "--color-primary": v(tokens.colors.primary, "#000000"),
    "--color-secondary": v(tokens.colors.secondary, "#62666d"),
    "--color-accent": v(tokens.colors.accent, "#5e6ad2"),
    "--color-background": v(tokens.colors.background, "#ffffff"),
    "--color-surface": v(tokens.colors.surface, "#f9fafb"),
    "--color-text": v(tokens.colors.text, "#000000"),
    "--color-text-muted": v(tokens.colors.textMuted, "#62666d"),
    "--radius-sm": `${tokens.radius.small ?? 8}px`,
    "--radius-md": `${tokens.radius.medium ?? 12}px`,
    "--radius-lg": `${tokens.radius.large ?? 24}px`,
    "--space-1": `${base}px`,
    "--space-2": `${base * 2}px`,
    "--space-3": `${base * 3}px`,
    "--space-4": `${base * 4}px`,
    "--space-6": `${base * 6}px`,
    "--space-8": `${base * 8}px`,
    "--shadow": tokens.shadows[0]?.value ?? "none",
  };
}

export default function StyleguidePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<ScrapedTokens | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("atoms");
  const loadingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (loadingInterval.current) clearInterval(loadingInterval.current); };
  }, []);

  const handleExtract = async () => {
    let u = url.trim();
    if (!u) { setError("Please enter a URL"); return; }
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;

    setError(null); setLoading(true); setLoadingStep(0); setTokens(null);

    let step = 0;
    loadingInterval.current = setInterval(() => {
      step = Math.min(step + 1, LOADING_STEPS.length - 1);
      setLoadingStep(step);
    }, 2200);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      if (loadingInterval.current) clearInterval(loadingInterval.current);

      if (!res.ok) {
        setError("Couldn't access that site. Try another URL.");
        setLoading(false); return;
      }

      const data: ScrapedTokens = await res.json();
      setTokens(data);
      setActiveTab("atoms");
      setLoading(false);
    } catch {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
      setError("Couldn't access that site. Try another URL.");
      setLoading(false);
    }
  };

  const tv = tokens ? buildTokenVars(tokens) : null;
  const headingFont = tokens?.typography.headingFont?.family ?? "sans-serif";
  const bodyFont = tokens?.typography.bodyFont?.family ?? "sans-serif";

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#191a1f", color: "#f7f8f8" }}>
      {/* URL input bar */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            backgroundColor: "#1e1f25", borderRadius: "7px",
            border: error ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.06)",
            padding: "4px",
            boxShadow: "rgba(0, 0, 0, 0) 0px 8px 2px 0px, rgba(0, 0, 0, 0.01) 0px 5px 2px 0px, rgba(0, 0, 0, 0.04) 0px 3px 2px 0px, rgba(0, 0, 0, 0.07) 0px 1px 1px 0px, rgba(0, 0, 0, 0.08) 0px 0px 1px 0px",
          }}>
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleExtract(); }}
              placeholder="Enter a URL to extract its design system (e.g. linear.app)"
              disabled={loading}
              style={{
                flex: 1, height: "36px", padding: "8px 16px",
                fontSize: "14px", fontWeight: 400, letterSpacing: "-0.165px",
                color: "#f7f8f8",
                backgroundColor: "transparent", border: "none", outline: "none",
                opacity: loading ? 0.5 : 1,
              }}
            />
            <button
              onClick={handleExtract}
              disabled={loading}
              style={{
                height: "36px", padding: "8px 20px",
                fontSize: "14px", fontWeight: 510, color: "#ffffff",
                backgroundColor: "#5e6ad2", border: "none", borderRadius: "7px",
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
            >
              {loading ? "Extracting…" : "Extract"}
            </button>
          </div>
          {tokens && (
            <span style={{ fontSize: "13px", color: "#8a8f98", whiteSpace: "nowrap" }}>
              {tokens.domain}
            </span>
          )}
        </div>
        {error && (
          <p style={{ maxWidth: "1200px", margin: "8px auto 0", fontSize: "13px", color: "#ef4444" }}>{error}</p>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "16px" }}>
          <div style={{ width: "20px", height: "20px", position: "relative" }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "9999px",
              border: "2px solid #5e6ad2", borderTopColor: "transparent",
              animation: "spin 1s linear infinite",
            }} />
          </div>
          <span style={{ fontFamily: "monospace", fontSize: "14px", color: "#8a8f98" }}>
            {LOADING_STEPS[loadingStep]}
          </span>
          <div style={{ width: "240px", height: "2px", borderRadius: "7px", backgroundColor: "#e5e7eb", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "7px", backgroundColor: "#5e6ad2",
              width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%`,
              transition: "width 0.7s ease-out",
            }} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!tokens && !loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh", gap: "16px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "7px", backgroundColor: "#25262d", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#62666d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 style={{ fontSize: "34px", fontWeight: 400, letterSpacing: "0.69px", color: "#f7f8f8" }}>Atomic Styleguide</h2>
          <p style={{ fontSize: "16px", fontWeight: 400, color: "#8a8f98", maxWidth: "400px", textAlign: "center" }}>
            Enter a URL above to extract a design system and preview it as atoms, molecules, and organisms.
          </p>
        </div>
      )}

      {/* Styleguide content */}
      {tokens && tv && !loading && (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0" }}>
            {([
              { key: "atoms" as TabKey, label: "Atoms" },
              { key: "molecules" as TabKey, label: "Molecules" },
              { key: "organisms" as TabKey, label: "Organisms" },
              { key: "tokens" as TabKey, label: "Tokens" },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "12px 24px", fontSize: "14px", cursor: "pointer",
                  fontWeight: activeTab === tab.key ? 500 : 300,
                  color: activeTab === tab.key ? "#000000" : "#62666d",
                  backgroundColor: "transparent", border: "none",
                  borderBottom: activeTab === tab.key ? "2px solid #5e6ad2" : "2px solid transparent",
                  marginBottom: "-1px",
                  transition: "background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══════ ATOMS TAB ═══════ */}
          {activeTab === "atoms" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
              {/* Typography */}
              <section>
                <SectionTitle>Typography</SectionTitle>
                <p style={{ fontSize: "14px", color: "#8a8f98", marginBottom: "24px" }}>
                  Headings: <strong>{headingFont}</strong> &middot; Body: <strong>{bodyFont}</strong>
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {tokens.typography.scale.map((entry, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "24px" }}>
                      <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#8a8f98", width: "48px", flexShrink: 0 }}>{entry.element}</span>
                      <span style={{
                        fontFamily: entry.element.startsWith("H") ? headingFont : bodyFont,
                        fontSize: `${Math.min(entry.size, 76)}px`,
                        fontWeight: entry.weight,
                        lineHeight: entry.lineHeight,
                        letterSpacing: entry.letterSpacing,
                        color: tv["--color-text"],
                      }}>
                        The quick brown fox
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Buttons */}
              <section>
                <SectionTitle>Buttons</SectionTitle>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
                  <button style={{
                    padding: `${tv["--space-2"]} ${tv["--space-4"]}`,
                    backgroundColor: tv["--color-primary"],
                    color: "#ffffff",
                    borderRadius: tv["--radius-md"],
                    border: "none", fontSize: "15px", fontWeight: 510, cursor: "pointer",
                    transition: "background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}>
                    Primary Button
                  </button>
                  <button style={{
                    padding: `${tv["--space-2"]} ${tv["--space-4"]}`,
                    backgroundColor: "transparent",
                    color: tv["--color-primary"],
                    borderRadius: tv["--radius-md"],
                    border: `1px solid ${tv["--color-secondary"]}`,
                    fontSize: "15px", fontWeight: 510, cursor: "pointer",
                    transition: "background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}>
                    Secondary Button
                  </button>
                  <button style={{
                    padding: `${tv["--space-2"]} ${tv["--space-4"]}`,
                    backgroundColor: "transparent",
                    color: tv["--color-text-muted"],
                    borderRadius: tv["--radius-md"],
                    border: "1px solid transparent",
                    fontSize: "15px", fontWeight: 510, cursor: "pointer",
                    transition: "background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}>
                    Ghost Button
                  </button>
                  <button style={{
                    padding: `${tv["--space-2"]} ${tv["--space-4"]}`,
                    backgroundColor: tv["--color-accent"],
                    color: "#ffffff",
                    borderRadius: tv["--radius-md"],
                    border: "none", fontSize: "15px", fontWeight: 510, cursor: "pointer",
                    transition: "background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}>
                    Accent Button
                  </button>
                  <button style={{
                    padding: `${tv["--space-2"]} ${tv["--space-4"]}`,
                    backgroundColor: tv["--color-primary"],
                    color: "#ffffff",
                    borderRadius: tv["--radius-md"],
                    border: "none", fontSize: "15px", fontWeight: 510,
                    cursor: "not-allowed", opacity: 0.5,
                  }}>
                    Disabled
                  </button>
                </div>
              </section>

              {/* Inputs */}
              <section>
                <SectionTitle>Inputs</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px" }}>
                  <input
                    placeholder="Default input"
                    readOnly
                    style={{
                      padding: `${tv["--space-2"]} ${tv["--space-3"]}`,
                      backgroundColor: tv["--color-surface"],
                      color: tv["--color-text"],
                      borderRadius: tv["--radius-md"],
                      border: `1px solid ${tv["--color-secondary"]}`,
                      fontSize: "15px", fontWeight: 400, outline: "none",
                    }}
                  />
                  <input
                    placeholder="Error state"
                    readOnly
                    style={{
                      padding: `${tv["--space-2"]} ${tv["--space-3"]}`,
                      backgroundColor: tv["--color-surface"],
                      color: tv["--color-text"],
                      borderRadius: tv["--radius-md"],
                      border: "1px solid #ef4444",
                      fontSize: "15px", fontWeight: 400, outline: "none",
                    }}
                  />
                  <input
                    placeholder="Disabled input"
                    readOnly
                    disabled
                    style={{
                      padding: `${tv["--space-2"]} ${tv["--space-3"]}`,
                      backgroundColor: tv["--color-surface"],
                      color: tv["--color-text"],
                      borderRadius: tv["--radius-md"],
                      border: `1px solid ${tv["--color-secondary"]}`,
                      fontSize: "15px", fontWeight: 400, outline: "none",
                      opacity: 0.5,
                    }}
                  />
                </div>
              </section>

              {/* Badges */}
              <section>
                <SectionTitle>Badges</SectionTitle>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{
                    padding: "4px 12px", fontSize: "12px", fontWeight: 510,
                    backgroundColor: tv["--color-primary"], color: "#ffffff",
                    borderRadius: "9999px",
                  }}>Default</span>
                  <span style={{
                    padding: "4px 12px", fontSize: "12px", fontWeight: 510,
                    backgroundColor: tv["--color-accent"], color: "#ffffff",
                    borderRadius: "9999px",
                  }}>Accent</span>
                  <span style={{
                    padding: "4px 12px", fontSize: "12px", fontWeight: 510,
                    backgroundColor: tv["--color-surface"], color: tv["--color-text-muted"],
                    borderRadius: "9999px", border: `1px solid ${tv["--color-secondary"]}`,
                  }}>Muted</span>
                </div>
              </section>

              {/* Color Swatches */}
              <section>
                <SectionTitle>Colors</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
                  {[
                    { name: "Primary", value: tv["--color-primary"] },
                    { name: "Secondary", value: tv["--color-secondary"] },
                    { name: "Accent", value: tv["--color-accent"] },
                    { name: "Background", value: tv["--color-background"] },
                    { name: "Surface", value: tv["--color-surface"] },
                    { name: "Text", value: tv["--color-text"] },
                    { name: "Text Muted", value: tv["--color-text-muted"] },
                  ].map((c) => (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "48px", height: "48px", flexShrink: 0,
                        borderRadius: tv["--radius-sm"],
                        backgroundColor: c.value,
                        border: "1px solid rgba(255,255,255,0.06)",
                      }} />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 510, color: "#f7f8f8" }}>{c.name}</div>
                        <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#8a8f98" }}>{c.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Spacing */}
              <section>
                <SectionTitle>Spacing Scale</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[1, 2, 3, 4, 6, 8].map((mult) => {
                    const px = (tokens.spacing.baseUnit ?? 4) * mult;
                    return (
                      <div key={mult} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#8a8f98", width: "80px" }}>--space-{mult}</span>
                        <div style={{ width: `${Math.min(px, 200)}px`, height: "24px", backgroundColor: `${tv["--color-accent"]}20`, border: `1px solid ${tv["--color-accent"]}40`, borderRadius: "4px" }} />
                        <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#8a8f98" }}>{px}px</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Border Radius */}
              <section>
                <SectionTitle>Border Radius</SectionTitle>
                <div style={{ display: "flex", gap: "24px" }}>
                  {[
                    { label: "sm", value: tv["--radius-sm"] },
                    { label: "md", value: tv["--radius-md"] },
                    { label: "lg", value: tv["--radius-lg"] },
                    { label: "full", value: "9999px" },
                  ].map((r) => (
                    <div key={r.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "56px", height: "56px",
                        border: `2px solid ${tv["--color-accent"]}`,
                        backgroundColor: `${tv["--color-accent"]}10`,
                        borderRadius: r.value,
                      }} />
                      <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#f7f8f8" }}>{r.label}</span>
                      <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#8a8f98" }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Shadows */}
              {tokens.shadows.length > 0 && (
                <section>
                  <SectionTitle>Shadows</SectionTitle>
                  <div style={{ display: "flex", gap: "24px" }}>
                    {tokens.shadows.slice(0, 3).map((s, i) => (
                      <div key={i} style={{
                        width: "120px", height: "120px",
                        backgroundColor: tv["--color-surface"],
                        borderRadius: tv["--radius-md"],
                        boxShadow: s.value,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#8a8f98" }}>shadow {i + 1}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ═══════ MOLECULES TAB ═══════ */}
          {activeTab === "molecules" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
              {/* SearchBar */}
              <section>
                <SectionTitle>SearchBar</SectionTitle>
                <ComponentLabel>Input + Button</ComponentLabel>
                <div style={{
                  display: "flex", alignItems: "center", maxWidth: "480px",
                  backgroundColor: tv["--color-surface"],
                  borderRadius: tv["--radius-md"],
                  border: `1px solid ${tv["--color-secondary"]}`,
                  padding: "4px",
                }}>
                  <input
                    placeholder="Search..."
                    readOnly
                    style={{
                      flex: 1, height: "36px", padding: "8px 16px",
                      fontSize: "14px", fontWeight: 400, color: tv["--color-text"],
                      backgroundColor: "transparent", border: "none", outline: "none",
                    }}
                  />
                  <button style={{
                    height: "36px", padding: "8px 20px",
                    fontSize: "14px", fontWeight: 510, color: "#ffffff",
                    backgroundColor: tv["--color-accent"],
                    border: "none", borderRadius: tv["--radius-md"], cursor: "pointer",
                  }}>
                    Search
                  </button>
                </div>
              </section>

              {/* Card */}
              <section>
                <SectionTitle>Card</SectionTitle>
                <ComponentLabel>Surface + Typography + Button</ComponentLabel>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                  {[1, 2, 3].map((n) => (
                    <div key={n} style={{
                      backgroundColor: tv["--color-surface"],
                      borderRadius: tv["--radius-lg"],
                      padding: tv["--space-6"],
                      boxShadow: tv["--shadow"],
                      border: tv["--shadow"] === "none" ? `1px solid ${tv["--color-secondary"]}` : "none",
                    }}>
                      <span style={{
                        display: "inline-block", padding: "4px 12px", fontSize: "12px", fontWeight: 510,
                        backgroundColor: tv["--color-accent"], color: "#ffffff",
                        borderRadius: "9999px", marginBottom: "12px",
                      }}>Feature {n}</span>
                      <h3 style={{
                        fontFamily: headingFont, fontSize: "24px", fontWeight: 400,
                        color: tv["--color-text"], marginBottom: "8px",
                      }}>
                        Card Title
                      </h3>
                      <p style={{
                        fontFamily: bodyFont, fontSize: "14px", fontWeight: 400,
                        color: tv["--color-text-muted"], marginBottom: "16px", lineHeight: 1.5,
                      }}>
                        A brief description of this feature or content block using the extracted body font and muted text color.
                      </p>
                      <button style={{
                        padding: `${tv["--space-2"]} ${tv["--space-4"]}`,
                        backgroundColor: tv["--color-primary"],
                        color: "#ffffff",
                        borderRadius: tv["--radius-md"],
                        border: "none", fontSize: "14px", fontWeight: 510, cursor: "pointer",
                      }}>
                        Learn more
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* FormField */}
              <section>
                <SectionTitle>FormField</SectionTitle>
                <ComponentLabel>Typography (label) + Input + Typography (error)</ComponentLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 510, color: tv["--color-text"], marginBottom: "6px" }}>
                      Email address
                    </label>
                    <input
                      placeholder="you@example.com"
                      readOnly
                      style={{
                        width: "100%", padding: `${tv["--space-2"]} ${tv["--space-3"]}`,
                        backgroundColor: tv["--color-surface"], color: tv["--color-text"],
                        borderRadius: tv["--radius-md"],
                        border: `1px solid ${tv["--color-secondary"]}`,
                        fontSize: "14px", fontWeight: 400, outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 510, color: tv["--color-text"], marginBottom: "6px" }}>
                      Password
                    </label>
                    <input
                      placeholder="Enter password"
                      readOnly
                      style={{
                        width: "100%", padding: `${tv["--space-2"]} ${tv["--space-3"]}`,
                        backgroundColor: tv["--color-surface"], color: tv["--color-text"],
                        borderRadius: tv["--radius-md"],
                        border: "1px solid #ef4444",
                        fontSize: "14px", fontWeight: 400, outline: "none",
                      }}
                    />
                    <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>Password must be at least 8 characters</p>
                  </div>
                </div>
              </section>

              {/* Stat */}
              <section>
                <SectionTitle>Stat</SectionTitle>
                <ComponentLabel>Typography (value) + Typography (label)</ComponentLabel>
                <div style={{ display: "flex", gap: "32px" }}>
                  {[
                    { value: "2.4M", label: "Active Users" },
                    { value: "99.9%", label: "Uptime" },
                    { value: "150+", label: "Countries" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div style={{
                        fontFamily: headingFont, fontSize: "36px", fontWeight: 400,
                        color: tv["--color-text"], letterSpacing: "0.5px",
                      }}>{stat.value}</div>
                      <div style={{ fontSize: "14px", color: tv["--color-text-muted"], fontWeight: 400 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* NavItem */}
              <section>
                <SectionTitle>NavItem</SectionTitle>
                <ComponentLabel>Icon + Typography</ComponentLabel>
                <div style={{ display: "flex", gap: "4px" }}>
                  {["Home", "Products", "About", "Contact"].map((item) => (
                    <div key={item} style={{
                      padding: "8px 16px", borderRadius: tv["--radius-sm"],
                      fontSize: "14px", fontWeight: 400, color: tv["--color-text-muted"],
                      cursor: "pointer", transition: "background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    }}>
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ═══════ ORGANISMS TAB ═══════ */}
          {activeTab === "organisms" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
              {/* Header */}
              <section>
                <SectionTitle>Header</SectionTitle>
                <ComponentLabel>Logo + NavItem[] + Button (CTA)</ComponentLabel>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: `${tv["--space-3"]} ${tv["--space-6"]}`,
                  backgroundColor: tv["--color-background"],
                  borderRadius: tv["--radius-md"],
                  border: `1px solid ${tv["--color-secondary"]}30`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: tv["--radius-sm"],
                      backgroundColor: tv["--color-accent"],
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: "13px", fontWeight: 510, color: "#ffffff" }}>B</span>
                    </div>
                    <span style={{ fontSize: "15px", fontWeight: 510, color: tv["--color-text"] }}>Brand</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    {["Features", "Pricing", "Docs"].map((item) => (
                      <span key={item} style={{ fontSize: "14px", fontWeight: 400, color: tv["--color-text-muted"], cursor: "pointer" }}>
                        {item}
                      </span>
                    ))}
                    <button style={{
                      padding: "8px 20px", fontSize: "14px", fontWeight: 510,
                      color: "#ffffff", backgroundColor: tv["--color-accent"],
                      borderRadius: tv["--radius-md"], border: "none", cursor: "pointer",
                    }}>
                      Get Started
                    </button>
                  </div>
                </div>
              </section>

              {/* Hero */}
              <section>
                <SectionTitle>Hero</SectionTitle>
                <ComponentLabel>Typography (h1 + p) + SearchBar or Button</ComponentLabel>
                <div style={{
                  padding: `${tv["--space-8"]} ${tv["--space-6"]}`,
                  backgroundColor: tv["--color-background"],
                  borderRadius: tv["--radius-lg"],
                  border: `1px solid ${tv["--color-secondary"]}30`,
                  textAlign: "center",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "20px",
                }}>
                  <h1 style={{
                    fontFamily: headingFont,
                    fontSize: `${Math.min(tokens.typography.scale[0]?.size ?? 52, 64)}px`,
                    fontWeight: 400, color: tv["--color-text"],
                    lineHeight: 1.1, letterSpacing: "1px",
                  }}>
                    Build something beautiful
                  </h1>
                  <p style={{
                    fontFamily: bodyFont,
                    fontSize: "18px", fontWeight: 400,
                    color: tv["--color-text-muted"], maxWidth: "480px", lineHeight: 1.5,
                  }}>
                    A short tagline that captures your product's value proposition in one sentence.
                  </p>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button style={{
                      padding: "12px 32px", fontSize: "15px", fontWeight: 510,
                      color: "#ffffff", backgroundColor: tv["--color-accent"],
                      borderRadius: tv["--radius-md"], border: "none", cursor: "pointer",
                    }}>
                      Get Started
                    </button>
                    <button style={{
                      padding: "12px 32px", fontSize: "15px", fontWeight: 510,
                      color: tv["--color-primary"], backgroundColor: "transparent",
                      borderRadius: tv["--radius-md"],
                      border: `1px solid ${tv["--color-secondary"]}`,
                      cursor: "pointer",
                    }}>
                      Learn More
                    </button>
                  </div>
                </div>
              </section>

              {/* CardGrid */}
              <section>
                <SectionTitle>CardGrid</SectionTitle>
                <ComponentLabel>Card[]</ComponentLabel>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                  {[
                    { title: "Fast", desc: "Built for speed from the ground up" },
                    { title: "Secure", desc: "Enterprise-grade security by default" },
                    { title: "Scalable", desc: "Grows with your team and traffic" },
                  ].map((card) => (
                    <div key={card.title} style={{
                      backgroundColor: tv["--color-surface"],
                      borderRadius: tv["--radius-lg"],
                      padding: tv["--space-6"],
                      boxShadow: tv["--shadow"],
                      border: tv["--shadow"] === "none" ? `1px solid ${tv["--color-secondary"]}30` : "none",
                    }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: tv["--radius-sm"],
                        backgroundColor: `${tv["--color-accent"]}20`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: "16px",
                      }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "4px", backgroundColor: tv["--color-accent"] }} />
                      </div>
                      <h3 style={{
                        fontFamily: headingFont, fontSize: "20px", fontWeight: 400,
                        color: tv["--color-text"], marginBottom: "8px",
                      }}>{card.title}</h3>
                      <p style={{
                        fontFamily: bodyFont, fontSize: "14px", fontWeight: 400,
                        color: tv["--color-text-muted"], lineHeight: 1.5,
                      }}>{card.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Footer */}
              <section>
                <SectionTitle>Footer</SectionTitle>
                <ComponentLabel>NavItem[] + Typography + Icon[] (social)</ComponentLabel>
                <div style={{
                  padding: `${tv["--space-6"]} ${tv["--space-6"]}`,
                  backgroundColor: tv["--color-surface"],
                  borderRadius: tv["--radius-md"],
                  border: `1px solid ${tv["--color-secondary"]}30`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 510, color: tv["--color-text"], marginBottom: "12px" }}>Brand</div>
                      {["Features", "Pricing", "Docs"].map((item) => (
                        <div key={item} style={{ fontSize: "14px", color: tv["--color-text-muted"], fontWeight: 400, marginBottom: "8px" }}>{item}</div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 510, color: tv["--color-text"], marginBottom: "12px" }}>Company</div>
                      {["About", "Blog", "Careers"].map((item) => (
                        <div key={item} style={{ fontSize: "14px", color: tv["--color-text-muted"], fontWeight: 400, marginBottom: "8px" }}>{item}</div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 510, color: tv["--color-text"], marginBottom: "12px" }}>Legal</div>
                      {["Privacy", "Terms", "Security"].map((item) => (
                        <div key={item} style={{ fontSize: "14px", color: tv["--color-text-muted"], fontWeight: 400, marginBottom: "8px" }}>{item}</div>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderTop: `1px solid ${tv["--color-secondary"]}30`, paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: tv["--color-text-muted"], fontWeight: 400 }}>
                      &copy; 2026 Brand. All rights reserved.
                    </span>
                    <div style={{ display: "flex", gap: "12px" }}>
                      {["Twitter", "GitHub", "LinkedIn"].map((s) => (
                        <span key={s} style={{ fontSize: "13px", color: tv["--color-text-muted"], fontWeight: 400, cursor: "pointer" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ═══════ TOKENS TAB ═══════ */}
          {activeTab === "tokens" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              <section>
                <SectionTitle>Design Tokens (CSS Variables)</SectionTitle>
                <div style={{
                  fontFamily: "monospace", fontSize: "13px",
                  backgroundColor: tv["--color-primary"],
                  color: "#f9fafb",
                  borderRadius: tv["--radius-sm"],
                  padding: "24px",
                  lineHeight: 2,
                  overflow: "auto",
                }}>
                  {Object.entries(tv).map(([key, val]) => (
                    <div key={key}>
                      <span style={{ color: "#8a8f98" }}>--</span>
                      <span style={{ color: "#5e6ad2" }}>{key.replace("--", "")}</span>
                      <span style={{ color: "#8a8f98" }}>: </span>
                      <span>{val}</span>
                      <span style={{ color: "#8a8f98" }}>;</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Raw CSS variables from site */}
              {Object.keys(tokens.cssVariables).length > 0 && (
                <section>
                  <SectionTitle>Site&apos;s Own CSS Custom Properties</SectionTitle>
                  <div style={{
                    fontFamily: "monospace", fontSize: "13px",
                    backgroundColor: "#25262d",
                    borderRadius: tv["--radius-sm"],
                    padding: "24px",
                    lineHeight: 2,
                    overflow: "auto", maxHeight: "400px",
                  }}>
                    {Object.entries(tokens.cssVariables).slice(0, 50).map(([key, val]) => (
                      <div key={key}>
                        <span style={{ color: "#8a8f98" }}>{key}</span>
                        <span style={{ color: "#f7f8f8" }}>: {val};</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Platform */}
              <section>
                <SectionTitle>Platform Detection</SectionTitle>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    padding: "4px 16px", fontSize: "14px", fontWeight: 510,
                    backgroundColor: tv["--color-accent"], color: "#ffffff",
                    borderRadius: "9999px",
                  }}>
                    {tokens.platform.name}
                  </span>
                  <span style={{ fontSize: "14px", color: "#8a8f98" }}>
                    {Math.round(tokens.platform.confidence * 100)}% confidence
                  </span>
                </div>
                {tokens.platform.signals.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                    {tokens.platform.signals.map((s, i) => (
                      <span key={i} style={{
                        padding: "2px 10px", fontSize: "12px",
                        backgroundColor: "#25262d", color: "#8a8f98",
                        borderRadius: "9999px", fontFamily: "monospace",
                      }}>{s}</span>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

// ── Sub-components ──

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: "12px", fontWeight: 510, textTransform: "uppercase",
      letterSpacing: "0.08em", color: "#8a8f98", marginBottom: "20px",
    }}>
      {children}
    </h3>
  );
}

function ComponentLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "13px", color: "#8a8f98", marginBottom: "16px", marginTop: "-12px" }}>
      {children}
    </p>
  );
}
