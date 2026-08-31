"use client";

import { useMemo, useState } from "react";
import { PlotPanel } from "@/components/PlotPanel";
import { WorldMap, type Parcel } from "@/components/WorldMap";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Label, PreviewTag } from "@/components/ui/Label";
import { parcels } from "@/lib/parcels";
import { liveMarkets, usd, worldTotals } from "@/lib/market";

/*
 * The whole proposition on one screen: what this is on the left, the world
 * in the middle, and a plot's own market on the right. Putting the pitch
 * and the product in the same viewport is the point — the map is the
 * argument, so nothing should stand between the headline and it.
 */
export function Atlas() {
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [query, setQuery] = useState("");

  const busiest = useMemo(
    () =>
      [...liveMarkets].sort((a, b) => b.volume24hUsd - a.volume24hUsd)[0] ??
      null,
    [],
  );

  const search = (raw: string) => {
    const term = raw.trim().toLowerCase();
    if (term.length === 0) return;
    const byNumber = Number.parseInt(term.replace(/^#/, ""), 10);
    const match = Number.isFinite(byNumber)
      ? parcels.find((parcel) => parcel.id === byNumber)
      : parcels.find((parcel) => parcel.country.toLowerCase().includes(term));
    if (match) setSelected(match);
  };

  const stats = [
    { key: "Plots", value: String(worldTotals.totalPlots) },
    { key: "Markets open", value: String(worldTotals.livePlots) },
    { key: "24h volume", value: usd(worldTotals.volume24hUsd) },
    { key: "Fees generated", value: usd(worldTotals.rewardsUsd) },
  ];

  return (
    <section id="map" className="scroll-mt-16 border-b border-rule">
      {/*
        Stated once, up front, in the same weight as the figures it governs.
        Every number on this screen is generated from the plot id until the
        contracts exist, and a market surface quietly showing invented
        volume is the one thing here that could cost somebody money.
      */}
      <div className="flex flex-wrap items-center gap-3 border-b border-rule bg-gold/10 px-4 py-2.5 sm:px-6">
        <PreviewTag />
        <p className="type-data text-chalk-soft">
          Pre-launch preview. Prices, volumes, owners and fees are sample data
          shown to demonstrate how a plot market works — not live figures. No
          contract is deployed yet.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)_400px]">
        {/* The pitch */}
        <div className="pitch sheet-grid border-b border-rule px-4 py-10 sm:px-6 xl:border-b-0 xl:border-r">
          <h1 className="type-hero wordmark-outline text-chalk">Plotland</h1>
          <p className="type-display mt-4 text-gold">Claim your land</p>
          <p className="type-display text-chalk">and earn</p>

          <span aria-hidden className="mt-6 block h-0.5 w-16 bg-gold" />

          <p className="type-body mt-6 max-w-[42ch] text-chalk-soft">
            Own shares of virtual land. Every plot has its own token, its own
            market and its own economy — so one plot can be held by hundreds of
            people at once, you included.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="#how">How it works</ButtonLink>
            <a
              href="#ledger"
              className="type-label border border-rule-strong px-4 py-3 text-chalk transition-colors duration-150 hover:border-gold hover:text-gold"
            >
              View market
            </a>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-px bg-rule/40">
            {stats.map((stat) => (
              <div key={stat.key} className="bg-void px-4 py-3">
                <dt>
                  <Label>{stat.key}</Label>
                </dt>
                <dd className="type-figure-sm mt-1.5 text-chalk">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The world */}
        <div className="relative">
          <WorldMap
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            className="h-[52vh] min-h-[340px] w-full xl:h-[calc(100vh-4rem)] xl:min-h-[560px]"
          />

          {/* Real controls, not decoration: find a plot, or clear the pick. */}
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
              {busiest && (
                <Button
                  variant="outline"
                  className="hidden px-3 py-2 sm:inline-flex"
                  onClick={() =>
                    setSelected(
                      parcels.find((parcel) => parcel.id === busiest.id) ?? null,
                    )
                  }
                >
                  Busiest
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* The plot */}
        <aside className="border-t border-rule p-4 xl:border-l xl:border-t-0">
          <PlotPanel parcel={selected} />
        </aside>
      </div>
    </section>
  );
}
