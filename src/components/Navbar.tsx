import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { siteConfig } from "@/lib/site-config";

const navLinks = [
  { href: "#map", label: "Map" },
  { href: "#how", label: "How it works" },
  { href: "#ledger", label: "Plots" },
  { href: "#faq", label: "FAQ" },
] as const;

/** The mark: a claim flag planted inside a plot. */
function Mark() {
  return (
    <svg width="22" height="25" viewBox="0 0 22 25" aria-hidden focusable="false">
      <path
        d="M11 1 L20.5 6.5 V17.5 L11 23 L1.5 17.5 V6.5 Z"
        fill="none"
        stroke="#f2a71b"
        strokeWidth="1.6"
      />
      <path d="M9 7 V17" stroke="#ffffff" strokeWidth="1.6" />
      <path d="M9 7.5 H15.5 L13.5 10 L15.5 12.5 H9 Z" fill="#f2a71b" />
    </svg>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-void/92 backdrop-blur-sm">
      <nav className="flex h-14 items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Mark />
          <span className="type-title text-chalk">{siteConfig.name}</span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="type-label text-chalk-soft transition-colors duration-150 hover:text-gold"
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
