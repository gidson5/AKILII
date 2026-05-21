"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cx } from "@yield-copilot/ui";

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M2.5 8.5L9 3l6.5 5.5V15a.8.8 0 01-.8.8h-3.4v-4.5H6.7v4.5H3.3a.8.8 0 01-.8-.8V8.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 7h6M6 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="currentColor" />
    </svg>
  );
}

function AlertsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 12V8a5 5 0 0110 0v4l1.2 1.5H2.8L4 12z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7.5 15.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CopilotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 9.5c.5 1 1.5 1.8 3 1.8s2.5-.8 3-1.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="6.8" cy="7.5" r="0.8" fill="currentColor" />
      <circle cx="11.2" cy="7.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

function navMatch(pathname: string, href: string, search: string) {
  if (href === "/") return pathname === href;
  if (href === "/copilot?tab=insights") return pathname.startsWith("/copilot") && search.includes("tab=insights");
  if (href === "/copilot") return pathname.startsWith("/copilot") && !search.includes("tab=insights");
  return pathname.startsWith(href);
}

function NavPill({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <>
      <span className="bottom-nav-link__icon-wrap">{icon}</span>
      <span>{label}</span>
    </>
  );
}

const navItems = [
  { href: "/", label: "Home", icon: <HomeIcon /> },
  { href: "/copilot", label: "Akili", icon: <CopilotIcon /> },
  { href: "/budget", label: "Budget", icon: <BudgetIcon /> },
  { href: "/alerts", label: "Alerts", icon: <AlertsIcon /> },
];

export function BottomNav() {
  const pathname = usePathname();
  const search = typeof window !== "undefined" ? window.location.search : "";

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {navItems.map((item) => {
        const isActive = navMatch(pathname, item.href, search);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cx("bottom-nav-link", isActive && "is-active")}
            aria-label={item.label}
          >
            <NavPill icon={item.icon} label={item.label} />
          </Link>
        );
      })}
    </nav>
  );
}
