"use client";

import { useState } from "react";
import { useConnect, useConnection } from "wagmi";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { OwnershipBar } from "@/components/OwnershipBar";
import type { Parcel } from "@/components/WorldMap";
import {
  marketFor,
  signedPercent,
  tokenPrice,
  usdExact,
} from "@/lib/market";
import { canClaim } from "@/lib/site-config";

/*
 * What a visitor sees when they click a plot, written as a guided flow
 * rather than a dashboard dump: which plot, what its market looks like,
 * and what buying into it would actually give them.
 *
 * The buy step is the teaching moment. Typing an amount and watching the
 * resulting percentage move is the fastest way to understand that you are
 * buying a share of a plot, not the plot — faster than any sentence on the
 * page, and it is why the field is there before trading is even open.
 */

const PRESET_AMOUNTS = [50, 250, 1000] as const;

function Step({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-rule px-5 py-5 last:border-b-0">
      <div className="mb-4 flex items-baseline gap-2.5">
        <span className="type-label text-gold">{index}</span>
        <h3 className="type-title text-chalk">{title}</h3>
      </div>
      {children}
    </section>
  );
}

/** The right-hand rail from a claim sheet, folded under the flow. */
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
          Every trade on a plot generates fees, and those fees are split
          between that plot&rsquo;s holders in proportion to what each one
          holds. A plot nobody trades pays nothing.
        </Note>
      </div>
    );
  }

  const market = marketFor(parcel.id);
  // Nobody holds anything until the contracts exist, so this stays honest
  // rather than showing an invented share.
  const yourShare = isConnected && canClaim ? 0 : null;

  // What a given spend would buy you of this plot. Share of supply is just
  // your spend against the plot's whole valuation.
  const projectedShare =
    market.isLive && market.marketCapUsd > 0
      ? (amount / market.marketCapUsd) * 100
      : 0;

  const figures = [
    { key: "Token price", value: tokenPrice(market.priceUsd) },
    { key: "Market cap", value: usdExact(market.marketCapUsd) },
    { key: "24h volume", value: usdExact(market.volume24hUsd) },
    { key: "Owners", value: String(market.owners) },
    { key: "Fees generated", value: usdExact(market.rewardsUsd) },
    {
      key: "Your ownership",
      value: yourShare === null ? "—" : `${yourShare.toFixed(2)}%`,
    },
  ];

  return (
    <div className="panel">
      <Step index="01" title="The plot">
        <div className="flex items-baseline justify-between gap-3">
          <span className="type-display text-chalk">
            #{String(parcel.id).padStart(3, "0")}
          </span>
          {market.isLive && (
            <span
              className={`type-figure-sm ${
                market.change24h >= 0 ? "text-gain" : "text-loss"
              }`}
            >
              {signedPercent(market.change24h)}
            </span>
          )}
        </div>
        <p className="type-data mt-2 text-chalk-soft">
          {parcel.country}
          {parcel.continent ? ` · ${parcel.continent}` : ""}
        </p>
        <p className="type-body mt-3 text-chalk-muted">
          Its own token, its own price, its own holders. Owning part of this
          plot gives you nothing in any of the other 998.
        </p>
      </Step>

      {market.isLive ? (
        <>
          <Step index="02" title="The market">
            <dl className="grid grid-cols-2 gap-px bg-rule/40">
              {figures.map((figure) => (
                <div key={figure.key} className="bg-field px-3 py-3">
                  <dt>
                    <Label>{figure.key}</Label>
                  </dt>
                  <dd className="type-figure-sm mt-1.5 text-chalk">
                    {figure.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-5">
              <OwnershipBar market={market} yourShare={yourShare} />
            </div>
          </Step>

          <Step index="03" title="Your share">
            <div className="flex flex-wrap gap-2">
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
                  min={1}
                  value={amount}
                  onChange={(event) =>
                    setAmount(Math.max(0, Number(event.target.value) || 0))
                  }
                  aria-label="Amount to buy in US dollars"
                  className="type-data w-20 bg-transparent text-chalk outline-none"
                />
              </label>
            </div>

            <div className="mt-4 border border-rule bg-void px-4 py-3.5">
              <Label className="block text-chalk-muted">
                That would make you
              </Label>
              <p className="type-figure mt-2 text-gold">
                {projectedShare < 0.01 && projectedShare > 0
                  ? "<0.01%"
                  : `${projectedShare.toFixed(2)}%`}
                <span className="type-data ml-2 text-chalk-soft">
                  owner of plot #{String(parcel.id).padStart(3, "0")}
                </span>
              </p>
            </div>

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
              <div className="mt-4 grid grid-cols-2 gap-3">
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
          </Step>
        </>
      ) : (
        <Step index="02" title="No market yet">
          <p className="type-body text-chalk-soft">
            Nobody has opened a market on this plot. Whoever opens it first
            sets the starting supply — after that anyone can buy in alongside
            them, and the plot starts generating fees like any other.
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
        </Step>
      )}

      <Note title="How ownership is measured">
        Your share is the percentage of this plot&rsquo;s tokens you hold —
        nothing else. Buy more and it rises, sell some and it falls, and the
        number is the same one used to split the plot&rsquo;s fees.
      </Note>

      <Note title="What you earn">
        Every buy and sell of this plot&rsquo;s token generates fees, split
        across its holders in proportion to what each holds. Busier plot, more
        fees to divide.
      </Note>
    </div>
  );
}
