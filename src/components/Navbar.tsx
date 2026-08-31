import Link from "next/link";
import { Drawer } from "@/components/Drawer";
import { WalletConnect } from "@/components/WalletConnect";
import { Label } from "@/components/ui/Label";
import { siteConfig } from "@/lib/site-config";
import { worldTotals } from "@/lib/market";

/*
 * The state of the world, carried in the header.
 *
 * Every chip is a real reading. They all sit at zero right now, and that is
 * the point — an honest empty board says "nothing has been taken yet" far
 * better than an invented one says anything at all.
 */
const chips = [
  { key: "Plots", value: String(worldTotals.totalPlots) },
  { key: "Claimed", value: `${worldTotals.claimedPct}%` },
  { key: "Owners", value: String(worldTotals.owners) },
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
      <nav className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <Drawer />

        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Mark />
          <span className="hidden sm:block">
            <span className="type-title block leading-none text-chalk">
              {siteConfig.name}
            </span>
            <span className="type-label mt-1 block text-gold">
              Own. Trade. Earn.
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-5 lg:flex">
          {chips.map((chip) => (
            <li key={chip.key} className="flex items-baseline gap-2">
              <Label className="text-chalk-muted">{chip.key}</Label>
              <span className="type-data text-chalk">{chip.value}</span>
            </li>
          ))}
          <li className="flex items-baseline gap-2">
            <Label className="text-chalk-muted">Token</Label>
            <span className="type-data text-gold">$PLT</span>
          </li>
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <a
            href="#how"
            className="type-label hidden text-chalk-soft transition-colors duration-150 hover:text-gold md:inline"
          >
            How it works
          </a>
          <WalletConnect />
        </div>
      </nav>
    </header>
  );
}
