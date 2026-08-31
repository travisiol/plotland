import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { Label } from "@/components/ui/Label";
import { siteConfig } from "@/lib/site-config";

const navLinks = [
  { href: "#map", label: "Map", active: true },
  { href: "#how", label: "How it works", active: false },
  { href: "#ledger", label: "Marketplace", active: false },
  { href: "#faq", label: "Docs", active: false },
] as const;

/** The mark: a claim flag planted inside a plot. */
function Mark() {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" aria-hidden focusable="false">
      <path
        d="M15 1.5 L28 9 V25 L15 32.5 L2 25 V9 Z"
        fill="none"
        stroke="#f2a71b"
        strokeWidth="2"
      />
      <path d="M12 10 V24" stroke="#ffffff" strokeWidth="2" />
      <path d="M12 10.5 H21 L18.2 14 L21 17.5 H12 Z" fill="#f2a71b" />
    </svg>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-void/92 backdrop-blur-sm">
      <nav className="flex h-16 items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Mark />
          <span className="block">
            <span className="type-title block leading-none text-chalk">
              {siteConfig.name}
            </span>
            <span className="type-label mt-1 block text-gold">
              Own. Trade. Earn.
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={`type-label block border-b-2 pb-1 transition-colors duration-150 ${
                  link.active
                    ? "border-gold text-gold"
                    : "border-transparent text-chalk-soft hover:text-chalk"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {/*
            The token pill. It is the loudest "live data" shape on the page,
            so it says outright that it is a sample rather than quoting a
            price for a token that does not exist yet.
          */}
          <span className="hidden items-center gap-2 border border-rule bg-field px-3 py-2 sm:flex">
            <span className="h-2 w-2 bg-gold" />
            <Label className="text-chalk">PLT</Label>
            <Label className="text-chalk-muted">Sample</Label>
          </span>
          <WalletConnect />
        </div>
      </nav>
    </header>
  );
}
