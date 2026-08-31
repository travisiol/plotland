"use client";

import { useState } from "react";
import { PlotPanel } from "@/components/PlotPanel";
import { Ticker } from "@/components/Ticker";
import { WorldMap, type Parcel } from "@/components/WorldMap";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { parcels } from "@/lib/parcels";
import { worldTotals } from "@/lib/market";

/*
 * The whole proposition on one screen: what this is on the left, the world
 * in the middle, a plot's own market on the right.
 *
 * Nothing here is sample data. Every counter is a real zero, which is why
 * the screen carries no disclaimer: an untouched map with 999 plots open is
 * the strongest thing this page can say, and it happens to be true.
 */
export function Atlas() {
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [query, setQuery] = useState("");

  const search = (raw: string) => {
    const term = raw.trim().toLowerCase();
    if (term.length === 0) return;
    const byNumber = Number.parseInt(term.replace(/^#/, ""), 10);
    const match = Number.isFinite(byNumber)
      ? parcels.find((parcel) => parcel.id === byNumber)
      : parcels.find((parcel) => parcel.country.toLowerCase().includes(term));
    if (match) setSelected(match);
  };

  const pills = [
    { key: "Chain", value: "Ethereum" },
    { key: "Markets open", value: String(worldTotals.livePlots) },
    {
      key: "Plots taken",
      value: `0 / ${worldTotals.totalPlots}`,
    },
    { key: "Owners", value: String(worldTotals.owners) },
  ];

  return (
    <section id="map" className="scroll-mt-16 border-b border-rule">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)_400px]">
        {/* The pitch */}
        <div className="pitch sheet-grid border-b border-rule px-4 py-10 sm:px-6 xl:border-b-0 xl:border-r">
          <Label className="text-gold">Genesis · Ethereum</Label>

          <h1 className="type-hero wordmark-outline mt-5 text-chalk">
            Plotland
          </h1>
          <p className="type-display mt-4 text-gold">Claim your land</p>
          <p className="type-display text-chalk">and earn</p>

          <span aria-hidden className="mt-6 block h-0.5 w-16 bg-gold" />

          <p className="type-body mt-6 max-w-[44ch] text-chalk-soft">
            Own shares of virtual land. Every plot has its own token, its own
            market and its own economy — so one plot can be held by hundreds of
            people at once, you included.
          </p>

          <p className="type-body mt-4 max-w-[44ch] text-chalk">
            The map is empty. All {worldTotals.totalPlots} plots are open, none
            are taken, and whoever gets there first picks first.
          </p>

          <dl className="mt-8 flex flex-wrap gap-2">
            {pills.map((pill) => (
              <div
                key={pill.key}
                className="flex items-baseline gap-2 border border-rule px-3 py-2"
              >
                <dt>
                  <Label className="text-chalk-muted">{pill.key}</Label>
                </dt>
                <dd className="type-data text-chalk">{pill.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="#how">How it works</ButtonLink>
            <a
              href="#ledger"
              className="type-label border border-rule-strong px-4 py-3 text-chalk transition-colors duration-150 hover:border-gold hover:text-gold"
            >
              Plots by territory
            </a>
          </div>
        </div>

        {/* The world */}
        <div className="relative">
          <WorldMap
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            className="h-[52vh] min-h-[340px] w-full xl:h-[calc(100vh-4rem)] xl:min-h-[560px]"
          />

          {/* Real controls: find a plot by number or by country. */}
          <div className="absolute inset-x-0 bottom-10 flex justify-center px-4">
            <div className="flex items-center gap-2 border border-rule bg-void/95 p-1.5">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") search(query);
                }}
                placeholder="Plot number or country"
                aria-label="Find a plot by number or country"
                className="type-data w-44 bg-transparent px-2 py-1.5 text-chalk outline-none placeholder:text-chalk-muted sm:w-56"
              />
              <Button
                variant="outline"
                className="px-3 py-2"
                onClick={() => search(query)}
              >
                Find
              </Button>
            </div>
          </div>
        </div>

        {/* The plot */}
        <aside className="border-t border-rule p-4 xl:border-l xl:border-t-0">
          <PlotPanel parcel={selected} />
        </aside>
      </div>

      <Ticker />
    </section>
  );
}
