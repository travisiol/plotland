"use client";

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
 * A plot's own market, on one panel.
 *
 * Every figure here answers the same question from a different angle: how
 * much of this plot do people want, and what does the trading throw off.
 * Nothing on it implies the visitor is buying the plot outright — the
 * ownership bar and the "your share" line exist precisely to stop that
 * reading.
 */
export function PlotPanel({ parcel }: { parcel: Parcel | null }) {
  const { isConnected } = useConnection();
  const { connect, connectors, isPending: isConnecting } = useConnect();

  if (parcel === null) {
    return (
      <div className="panel p-5">
        <Label className="text-chalk">Select a plot</Label>
        <p className="type-body mt-3 text-chalk-soft">
          Pick any hexagon on the map. Gold plots already have a market open;
          the brighter they burn, the more is being traded on them.
        </p>
        <p className="type-body mt-3 text-chalk-muted">
          Every plot has its own token. You buy a share of one, not the whole
          thing — hundreds of wallets can hold the same plot.
        </p>
      </div>
    );
  }

  const market = marketFor(parcel.id);
  // No contract yet, so nobody holds anything. This stays null rather than
  // showing an invented share.
  const yourShare = isConnected && canClaim ? 0 : null;

  const figures = market.isLive
    ? [
        { key: "Token price", value: tokenPrice(market.priceUsd) },
        { key: "Market cap", value: usdExact(market.marketCapUsd) },
        { key: "24h volume", value: usdExact(market.volume24hUsd) },
        { key: "Owners", value: String(market.owners) },
        { key: "Rewards generated", value: usdExact(market.rewardsUsd) },
        {
          key: "Your ownership",
          value: yourShare === null ? "—" : `${yourShare.toFixed(2)}%`,
        },
      ]
    : [];

  return (
    <div className="panel">
      <div className="flex items-baseline justify-between gap-3 border-b border-rule px-5 py-4">
        <div>
          <span className="type-display block text-chalk">
            Plot #{String(parcel.id).padStart(3, "0")}
          </span>
          <Label className="mt-1 block">
            {parcel.country}
            {parcel.continent ? ` · ${parcel.continent}` : ""}
          </Label>
        </div>
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

      {market.isLive ? (
        <>
          <dl className="grid grid-cols-2 gap-px border-b border-rule bg-rule/40">
            {figures.map((figure) => (
              <div key={figure.key} className="bg-field px-5 py-3.5">
                <dt>
                  <Label>{figure.key}</Label>
                </dt>
                <dd className="type-figure-sm mt-1.5 text-chalk">
                  {figure.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="border-b border-rule px-5 py-5">
            <OwnershipBar market={market} yourShare={yourShare} />
            <p className="type-data mt-4 text-chalk-muted">
              Your ownership is the percentage of this plot&rsquo;s tokens you
              hold. Fees from every trade on this plot are split the same way.
            </p>
          </div>
        </>
      ) : (
        <div className="border-b border-rule px-5 py-5">
          <p className="type-body text-chalk-soft">
            No market has been opened on this plot yet. Whoever opens it first
            sets the starting supply — after that anyone can buy in alongside
            them.
          </p>
        </div>
      )}

      <div className="px-5 py-5">
        {!isConnected ? (
          <Button
            className="w-full"
            disabled={!connectors[0] || isConnecting}
            onClick={() => connectors[0] && connect({ connector: connectors[0] })}
          >
            {isConnecting ? "Connecting…" : "Connect wallet"}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button disabled={!canClaim}>
              {market.isLive ? "Buy plot" : "Open market"}
            </Button>
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
    </div>
  );
}
