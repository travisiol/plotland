"use client";

import { useWorld } from "@/lib/worldState";

/*
 * The genesis strip.
 *
 * At launch this carries the state of the world in plain sentences; once
 * plots start trading the same strip is where real events land. Right now
 * the emptiness is the message — every line is true, and an untouched map
 * is a better pitch than any invented volume figure.
 */
export function Ticker() {
  const { isPreview, totals } = useWorld();

  const lines = isPreview
    ? [
        "Preview — an example of a world a few days old",
        `${totals.livePlots} plots opened, ${totals.totalPlots - totals.livePlots} still untouched`,
        `${totals.owners} wallets in so far`,
        "Green marks the plot with the most owners",
        "Nothing here is live; no contract is deployed",
      ]
    : [
        "Genesis — the map is unclaimed",
        `${totals.totalPlots} plots open, none taken`,
        "Every plot is its own token and its own market",
        "The first buyer on a plot sets its starting supply",
        "Trading fees are split between a plot's holders",
        "Whoever arrives first picks first",
      ];

  return (
    <div className="flex items-stretch border-t border-rule bg-void">
      <span className="flex shrink-0 items-center gap-2 border-r border-rule px-4 py-2.5">
        <span className="h-2 w-2 bg-gold" />
        <span className="type-label text-gold">
          {isPreview ? "Preview" : "Genesis"}
        </span>
      </span>

      <div className="relative flex-1 overflow-hidden">
        <div className="flex w-max animate-ticker">
          {/* Two copies so the loop has something to scroll into. */}
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
              {lines.map((line) => (
                <li
                  key={line}
                  className="flex items-center gap-4 whitespace-nowrap px-6 py-2.5"
                >
                  <span className="type-data text-chalk-soft">{line}</span>
                  <span aria-hidden className="text-gold/50">
                    ·
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <span className="hidden shrink-0 items-center border-l border-rule px-4 py-2.5 sm:flex">
        <span className="type-label text-chalk-muted">
          {totals.livePlots} / {totals.totalPlots} taken
        </span>
      </span>
    </div>
  );
}
