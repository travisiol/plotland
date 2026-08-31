"use client";

import { useState } from "react";
import { Globe } from "@/components/Globe";
import { InfoOverlay } from "@/components/InfoOverlay";
import { PlotPanel } from "@/components/PlotPanel";
import { Ticker } from "@/components/Ticker";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { parcels, type Parcel } from "@/lib/parcels";
import { worldTotals } from "@/lib/market";

/*
 * One page: the globe, and whatever is being looked at on it.
 *
 * There is nothing to scroll to. The pitch sits over the world until a plot
 * is picked, at which point it steps aside for that plot's sheet, and the
 * explanation opens over the top when asked for. A visitor only ever has
 * one thing in front of them.
 */
export function World() {
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const pills = [
    { key: "Chain", value: "Ethereum" },
    { key: "Markets", value: String(worldTotals.livePlots) },
    { key: "Plots taken", value: `0 / ${worldTotals.totalPlots}` },
    { key: "Owners", value: String(worldTotals.owners) },
  ];

  return (
    /*
     * Absolutely positioned rather than h-full: main is a flex-1 item, so
     * its computed height stays `auto` and a percentage height resolves to
     * zero against it. Filling the positioned ancestor sidesteps that.
     */
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <Globe
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          className="h-full w-full"
        />
      </div>

      {/* The pitch, until a plot takes its place. */}
      {!selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 px-4 sm:px-8">
          <div className="pointer-events-auto max-w-[560px]">
            <Label className="text-gold">Genesis · Ethereum</Label>

            <h1 className="type-hero wordmark-outline mt-4 text-chalk">
              Plotland
            </h1>
            <p className="type-display mt-3 text-gold">Claim your land</p>
            <p className="type-display text-chalk">and earn</p>

            <p className="type-body mt-5 max-w-[46ch] text-chalk-soft">
              Own shares of virtual land. Every plot has its own token and its
              own market, so one plot can be held by hundreds of people at
              once — you included.
            </p>
            <p className="type-body mt-3 max-w-[46ch] text-chalk">
              The globe is empty. All {worldTotals.totalPlots} plots are open,
              none are taken, and whoever gets there first picks first.
            </p>

            <dl className="mt-6 flex flex-wrap gap-2">
              {pills.map((pill) => (
                <div
                  key={pill.key}
                  className="flex items-baseline gap-2 border border-rule bg-void/70 px-3 py-2"
                >
                  <dt>
                    <Label className="text-chalk-muted">{pill.key}</Label>
                  </dt>
                  <dd className="type-data text-chalk">{pill.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              {/*
                Not a link — there is nothing to scroll to. It opens a plot,
                which is the fastest way to show a first-time visitor that
                the globe is something you click.
              */}
              <Button
                onClick={() =>
                  setSelected(
                    parcels[Math.floor(Math.random() * parcels.length)],
                  )
                }
              >
                Open a plot
              </Button>
              <Button variant="outline" onClick={() => setInfoOpen(true)}>
                How it works
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Once a plot is picked, the pitch collapses to one line. */}
      {selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 hidden px-4 sm:block sm:px-8">
          <div className="pointer-events-auto flex flex-wrap items-center gap-3">
            <Label className="text-chalk-muted">
              Ethereum · 0 / {worldTotals.totalPlots} plots taken
            </Label>
            <Button variant="outline" onClick={() => setInfoOpen(true)}>
              How it works
            </Button>
          </div>
        </div>
      )}

      {/* The plot sheet, over the world rather than beside it. */}
      {selected && (
        <div className="absolute inset-y-0 right-0 z-30 w-full max-w-[440px]">
          <PlotPanel parcel={selected} onClose={() => setSelected(null)} />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20">
        <Ticker />
      </div>

      {infoOpen && <InfoOverlay onClose={() => setInfoOpen(false)} />}
    </div>
  );
}
