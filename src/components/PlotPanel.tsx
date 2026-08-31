"use client";

import { useConnect, useConnection } from "wagmi";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import type { Parcel } from "@/components/WorldMap";
import { gridRef, marketFor, tierFor } from "@/lib/market";
import { canClaim } from "@/lib/site-config";

/*
 * What a visitor sees when they click a plot at genesis.
 *
 * No plot has a market yet, so there are no figures to show and none are
 * invented. The panel does the two useful things it can: say exactly what
 * this plot is, and explain what opening its market would mean — including
 * the part most people get wrong, that opening it does not make it yours
 * alone.
 */

/** How a plot's supply divides once it trades. A diagram, not a reading. */
function SplitDiagram() {
  const bands = [
    { label: "First buyer", width: "26%", tone: "bg-gold" },
    { label: "Next holders", width: "31%", tone: "bg-holder-near" },
    { label: "Everyone after", width: "43%", tone: "bg-holder-far" },
  ];
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden">
        {bands.map((band) => (
          <span
            key={band.label}
            className={band.tone}
            style={{ width: band.width }}
          />
        ))}
      </div>
      <ul className="mt-3">
        {bands.map((band) => (
          <li key={band.label} className="flex items-center gap-2 py-0.5">
            <span className={`h-2 w-2 rounded-full ${band.tone}`} />
            <span className="type-data text-chalk-soft">{band.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-rule px-5 py-4">
      <Label className="block text-chalk-muted">{title}</Label>
      <p className="type-body mt-2 text-chalk-soft">{children}</p>
    </div>
  );
}

export function PlotPanel({ parcel }: { parcel: Parcel | null }) {
  const { isConnected } = useConnection();
  const { connect, connectors, isPending: isConnecting } = useConnect();

  if (parcel === null) {
    return (
      <div className="panel">
        <div className="px-5 py-5">
          <Label className="text-chalk">Pick a plot</Label>
          <p className="type-body mt-3 text-chalk-soft">
            Click any hexagon on the map. Every one of them is open — no plot
            has a market yet, so the whole world is still first come.
          </p>
        </div>
        <Note title="What you are buying">
          A plot is a token, not a deed. You buy a share of it, and hundreds of
          wallets can hold the same plot at the same time.
        </Note>
        <Note title="What you earn">
          Every trade on a plot generates fees, split between that plot&rsquo;s
          holders in proportion to what each one holds. A plot nobody trades
          pays nothing.
        </Note>
      </div>
    );
  }

  const market = marketFor(parcel.id);
  const tier = tierFor(parcel.id);

  return (
    <div className="panel">
      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <span className="type-display text-chalk">
            Plot #{String(parcel.id).padStart(3, "0")}
          </span>
          <span className="type-label shrink-0 border border-rule px-2 py-1 text-chalk-muted">
            {tier}
          </span>
        </div>
        <p className="type-data mt-2 text-chalk-soft">{parcel.country}</p>
        <p className="type-data text-chalk-muted">
          {gridRef(parcel.x, parcel.y)}
          {parcel.continent ? ` · ${parcel.continent}` : ""}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-px border-y border-rule bg-rule/40">
        {[
          { key: "Owners", value: String(market.owners) },
          { key: "Token price", value: "—" },
          { key: "24h volume", value: "—" },
          { key: "Fees generated", value: "—" },
        ].map((stat) => (
          <div key={stat.key} className="bg-field px-4 py-3.5">
            <dt>
              <Label>{stat.key}</Label>
            </dt>
            <dd className="type-figure-sm mt-1.5 text-chalk-muted">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="px-5 py-5">
        <Label className="block text-gold">No market open yet</Label>
        <p className="type-body mt-3 text-chalk-soft">
          Nobody has opened this plot. Whoever does sets its starting supply
          and is its first holder — but not its only one. From that moment
          anyone can buy in alongside them, and the plot starts generating
          fees like any other.
        </p>

        <div className="mt-5 border border-rule bg-void px-4 py-4">
          <Label className="block text-chalk-muted">
            How this plot would split
          </Label>
          <p className="type-data mb-4 mt-1 text-chalk-muted">
            An illustration of the mechanic, not a reading — nothing has
            traded yet.
          </p>
          <SplitDiagram />
        </div>

        {!isConnected ? (
          <Button
            className="mt-5 w-full"
            disabled={!connectors[0] || isConnecting}
            onClick={() => connectors[0] && connect({ connector: connectors[0] })}
          >
            {isConnecting ? "Connecting…" : "Connect wallet"}
          </Button>
        ) : (
          <Button className="mt-5 w-full" disabled={!canClaim}>
            Open this market
          </Button>
        )}

        <p className="type-data mt-3 text-chalk-soft">
          {canClaim
            ? "Set the starting supply and become this plot's first holder."
            : "Opening markets starts a few minutes after launch. Connect now so you are ready."}
        </p>
      </div>

      <Note title="How ownership is measured">
        Your share is the percentage of this plot&rsquo;s tokens you hold —
        nothing else. Buy more and it rises, sell some and it falls, and it is
        the same number used to split the plot&rsquo;s fees.
      </Note>
    </div>
  );
}
