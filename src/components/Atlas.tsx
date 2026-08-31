"use client";

import { useState } from "react";
import { PlotPanel } from "@/components/PlotPanel";
import { WorldMap, type Parcel } from "@/components/WorldMap";
import { Label, PreviewTag } from "@/components/ui/Label";
import { usd, worldTotals } from "@/lib/market";

/*
 * The working surface: the world's figures on one side, the map in the
 * middle, the selected plot's own market on the other. Selection lives
 * here because the map and the panel both need it.
 */
export function Atlas() {
  const [selected, setSelected] = useState<Parcel | null>(null);

  const figures = [
    { key: "Plots", value: `${worldTotals.totalPlots}` },
    { key: "Markets open", value: `${worldTotals.livePlots}` },
    { key: "Owners", value: worldTotals.owners.toLocaleString("en-US") },
    { key: "24h volume", value: usd(worldTotals.volume24hUsd) },
    { key: "Fees generated", value: usd(worldTotals.rewardsUsd) },
  ];

  return (
    <section id="map" className="scroll-mt-14 border-b border-rule">
      {/*
        Stated once, up front, in the same weight as the figures it governs.
        Every number below it is generated from the plot id until the
        contracts exist, and a market surface quietly showing invented
        volume is the one thing here that could cost somebody money.
      */}
      <div className="flex flex-wrap items-center gap-3 border-b border-rule bg-gold/10 px-4 py-2.5 sm:px-6">
        <PreviewTag />
        <p className="type-data text-chalk-soft">
          Pre-launch preview. Prices, volumes, owners and fees below are sample
          data shown to demonstrate how a plot market works — they are not live
          figures, and no contract is deployed yet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_360px]">
        <aside className="order-2 border-t border-rule px-4 py-5 lg:order-1 lg:border-r lg:border-t-0">
          <Label className="text-chalk">The world</Label>

          <dl className="mt-4">
            {figures.map((figure) => (
              <div
                key={figure.key}
                className="flex items-baseline justify-between border-t border-rule py-3"
              >
                <dt>
                  <Label>{figure.key}</Label>
                </dt>
                <dd className="type-figure-sm text-chalk">{figure.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 border-t border-rule pt-4">
            <Label className="block">Key</Label>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-3 w-3 bg-gold" />
              <span className="type-data text-chalk-soft">Market open</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-3 w-3 bg-gold/40" />
              <span className="type-data text-chalk-soft">Quieter market</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-3 w-3 border border-rule-strong" />
              <span className="type-data text-chalk-soft">No market yet</span>
            </div>
          </div>

          <p className="type-data mt-6 text-chalk-muted">
            One map, {worldTotals.totalPlots} independent economies. Each plot
            has its own token and its own holders.
          </p>
        </aside>

        <div className="order-1 lg:order-2">
          <WorldMap
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            className="h-[52vh] min-h-[340px] w-full lg:h-[68vh] lg:min-h-[460px]"
          />
        </div>

        <aside className="order-3 border-t border-rule p-4 lg:border-l lg:border-t-0">
          <PlotPanel parcel={selected} />
        </aside>
      </div>
    </section>
  );
}
