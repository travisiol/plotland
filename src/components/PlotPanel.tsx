"use client";

import { useState } from "react";
import { useConnect, useConnection } from "wagmi";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { OwnershipBar } from "@/components/OwnershipBar";
import type { Parcel } from "@/components/WorldMap";
import {
  gridRef,
  marketFor,
  signedPercent,
  tierFor,
  tokenPrice,
  usdExact,
} from "@/lib/market";
import { canClaim } from "@/lib/site-config";

/*
 * The plot card: what a visitor sees the moment they click a hexagon.
 *
 * Identity, then the four numbers that matter, then the ownership
 * breakdown, then the trade. The breakdown sits above the buttons on
 * purpose — you should have seen that this plot already has hundreds of
 * owners before you reach anything that looks like a buy.
 */

const PRESET_AMOUNTS = [50, 250, 1000] as const;

const TIER_TONE: Record<string, string> = {
  Legendary: "border-gold text-gold",
  Rare: "border-holder-far text-holder-far",
  Uncommon: "border-rule-strong text-chalk-soft",
  Common: "border-rule text-chalk-muted",
  Unopened: "border-rule text-chalk-muted",
};

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
  const [amount, setAmount] = useState<number>(250);

  if (parcel === null) {
    return (
      <div className="panel">
        <div className="px-5 py-5">
          <Label className="text-chalk">Pick a plot</Label>
          <p className="type-body mt-3 text-chalk-soft">
            Click any hexagon on the map. Gold plots already have a market
            open; the brighter they burn, the more is being traded on them.
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
  // Nobody holds anything until the contracts exist, so this stays honest
  // rather than showing an invented share.
  const yourShare = isConnected && canClaim ? 0 : null;

  const projectedShare =
    market.isLive && market.marketCapUsd > 0
      ? (amount / market.marketCapUsd) * 100
      : 0;

  const stats = [
    { key: "Owners", value: String(market.owners) },
    {
      key: "Your share",
      value: yourShare === null ? "—" : `${yourShare.toFixed(2)}%`,
    },
    { key: "24h volume", value: usdExact(market.volume24hUsd) },
    { key: "Rewards generated", value: usdExact(market.rewardsUsd) },
  ];

  return (
    <div className="panel">
      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <span className="type-display text-chalk">
            Plot #{String(parcel.id).padStart(3, "0")}
          </span>
          <span
            className={`type-label shrink-0 border px-2 py-1 ${TIER_TONE[tier]}`}
          >
            {tier}
          </span>
        </div>
        <p className="type-data mt-2 text-chalk-soft">{parcel.country}</p>
        <p className="type-data text-chalk-muted">
          {gridRef(parcel.x, parcel.y)}
          {market.isLive ? ` · ${tokenPrice(market.priceUsd)}` : ""}
          {market.isLive ? (
            <span
              className={market.change24h >= 0 ? "text-gain" : "text-loss"}
            >
              {" "}
              {signedPercent(market.change24h)}
            </span>
          ) : null}
        </p>
      </div>

      {market.isLive ? (
        <>
          <dl className="grid grid-cols-2 gap-px border-y border-rule bg-rule/40">
            {stats.map((stat) => (
              <div key={stat.key} className="bg-field px-4 py-3.5">
                <dt>
                  <Label>{stat.key}</Label>
                </dt>
                <dd className="type-figure-sm mt-1.5 text-chalk">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="px-5 py-5">
            <OwnershipBar market={market} yourShare={yourShare} />
          </div>

          <div className="border-t border-rule px-5 py-5">
            {!isConnected ? (
              <Button
                className="w-full"
                disabled={!connectors[0] || isConnecting}
                onClick={() =>
                  connectors[0] && connect({ connector: connectors[0] })
                }
              >
                {isConnecting ? "Connecting…" : "Connect wallet"}
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button disabled={!canClaim}>Buy plot</Button>
                <Button variant="outline" disabled={!canClaim}>
                  Sell
                </Button>
              </div>
            )}
            <p className="type-data mt-3 text-chalk-soft">
              {canClaim
                ? "Buy as much or as little of this plot as you want."
                : "Trading opens a few minutes after launch. Connect now so you are ready."}
            </p>
          </div>

          {/*
            The share simulator. Watching the percentage move as the amount
            changes is the fastest way to understand you are buying a slice
            of a plot rather than the plot — faster than any sentence here.
          */}
          <div className="border-t border-rule px-5 py-5">
            <Label className="block text-chalk-muted">
              What would a buy get me
            </Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`type-data border px-3 py-1.5 transition-colors duration-150 ${
                    amount === preset
                      ? "border-gold bg-gold/15 text-gold"
                      : "border-rule text-chalk-soft hover:border-rule-strong"
                  }`}
                >
                  ${preset}
                </button>
              ))}
              <label className="flex items-center gap-2 border border-rule px-3 py-1.5">
                <span className="type-label text-chalk-muted">$</span>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(event) =>
                    setAmount(Math.max(0, Number(event.target.value) || 0))
                  }
                  aria-label="Amount to buy in US dollars"
                  className="type-data w-20 bg-transparent text-chalk outline-none"
                />
              </label>
            </div>
            <p className="type-figure mt-4 text-gold">
              {projectedShare < 0.01 && projectedShare > 0
                ? "<0.01%"
                : `${projectedShare.toFixed(2)}%`}
              <span className="type-data ml-2 text-chalk-soft">
                of plot #{String(parcel.id).padStart(3, "0")}
              </span>
            </p>
          </div>
        </>
      ) : (
        <div className="border-t border-rule px-5 py-5">
          <p className="type-body text-chalk-soft">
            Nobody has opened a market on this plot. Whoever opens it first
            sets the starting supply — after that anyone can buy in alongside
            them, and it starts generating fees like any other plot.
          </p>
          {!isConnected ? (
            <Button
              className="mt-4 w-full"
              disabled={!connectors[0] || isConnecting}
              onClick={() =>
                connectors[0] && connect({ connector: connectors[0] })
              }
            >
              {isConnecting ? "Connecting…" : "Connect wallet"}
            </Button>
          ) : (
            <Button className="mt-4 w-full" disabled={!canClaim}>
              Open this market
            </Button>
          )}
        </div>
      )}

      <Note title="How ownership is measured">
        Your share is the percentage of this plot&rsquo;s tokens you hold —
        nothing else. Buy more and it rises, sell some and it falls, and it is
        the same number used to split the plot&rsquo;s fees.
      </Note>
    </div>
  );
}
