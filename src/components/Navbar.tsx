"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Extract" },
  { href: "/styleguide", label: "Styleguide" },
  { href: "/compare", label: "Compare" },
  { href: "/wizard", label: "Wizard" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      backgroundColor: "#191a1f",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "0 24px",
    }}>
      <div style={{
        maxWidth: "1200px", margin: "0 auto",
        display: "flex", alignItems: "center",
        height: "48px", gap: "24px",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", marginRight: "8px" }}>
          <div style={{
            width: "24px", height: "24px", borderRadius: "4px",
            backgroundColor: "#5e6ad2",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 510, color: "#ffffff" }}>U</span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 510, color: "#f7f8f8", letterSpacing: "-0.1px" }}>
            uncodebase
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: isActive ? 510 : 400,
                  color: isActive ? "#f7f8f8" : "#8a8f98",
                  textDecoration: "none",
                  borderRadius: "4px",
                  backgroundColor: isActive ? "#25262d" : "transparent",
                  transition: "color 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  letterSpacing: "-0.1px",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
