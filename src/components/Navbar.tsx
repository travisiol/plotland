import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { siteConfig } from "@/lib/site-config";

const navLinks = [
  { href: "#map", label: "World map" },
  { href: "#ledger", label: "Ledger" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
] as const;

/** A surveyor's mark: a hexagon with a point set in it. */
function Mark() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden focusable="false">
      <path
        d="M8 0.6 L15.2 4.8 V13.2 L8 17.4 L0.8 13.2 V4.8 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="9" r="2.4" fill="#f0902b" />
    </svg>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/90 backdrop-blur-sm">
      <nav className="flex h-14 items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          <Mark />
          <span className="type-label text-ink">{siteConfig.name}</span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="type-label text-ink-soft transition-colors duration-150 hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <WalletConnect />
      </nav>
    </header>
  );
}
