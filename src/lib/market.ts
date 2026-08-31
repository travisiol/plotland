import { parcels } from "@/lib/parcels";

/*
 * Genesis.
 *
 * Nothing has been claimed and no plot has a market yet, so every figure on
 * this site is a real zero rather than a sample. That is a deliberate
 * choice: an empty map is the strongest thing this page can say right now —
 * all 999 plots are open and whoever arrives first picks first — and it
 * means the site never has to carry a disclaimer explaining which of its
 * numbers are invented.
 *
 * This module is the seam. When the contracts exist, the state below is
 * filled from `claimedBitmap()` and per-plot reads instead of constants,
 * and every component keeps working unchanged.
 */

export interface PlotMarket {
  id: number;
  /** False until somebody opens a market on this plot. */
  isLive: boolean;
  /** 0–1, drives how strongly the plot burns on the map once it trades. */
  activity: number;
  priceUsd: number;
  change24h: number;
  marketCapUsd: number;
  volume24hUsd: number;
  owners: number;
  rewardsUsd: number;
  /** Top holders' share of supply, largest first, as percentages. */
  topHolders: number[];
}

function unopened(id: number): PlotMarket {
  return {
    id,
    isLive: false,
    activity: 0,
    priceUsd: 0,
    change24h: 0,
    marketCapUsd: 0,
    volume24hUsd: 0,
    owners: 0,
    rewardsUsd: 0,
    topHolders: [],
  };
}

export function marketFor(id: number): PlotMarket {
  return unopened(id);
}

/** Every plot that has a market open. Empty at genesis. */
export const liveMarkets: PlotMarket[] = [];

export const worldTotals = {
  totalPlots: parcels.length,
  livePlots: 0,
  owners: 0,
  volume24hUsd: 0,
  rewardsUsd: 0,
  claimedPct: 0,
};

/** Scales map heat once plots start trading; harmless while nothing does. */
export const peakActivity = 1;

export type Tier = "Legendary" | "Rare" | "Uncommon" | "Common" | "Unopened";

export function tierFor(id: number): Tier {
  // Rarity is where a plot sits in the activity distribution, so at genesis
  // every plot is simply unopened. The id is the seam this reads from once
  // markets exist.
  return marketFor(id).isLive ? "Common" : "Unopened";
}

/** Grid reference on the hex lattice — the plot's real position on the map. */
export function gridRef(x: number, y: number): string {
  const col = Math.round((x + 2.66) / 0.0567);
  const row = Math.round((1.31 - y) / 0.0655);
  return `X: ${col} Y: ${row}`;
}

/**
 * How a plot's supply divides once it is trading: your slice, the next
 * largest holders, and the long tail. Used to draw the ownership bar.
 */
export function ownershipSplit(market: PlotMarket, yourShare: number) {
  const topTen = market.topHolders.reduce((sum, share) => sum + share, 0) * 1.35;
  const cappedTop = Math.min(Math.max(0, 100 - yourShare), topTen);
  const others = Math.max(0, 100 - yourShare - cappedTop);
  return { you: yourShare, topTen: cappedTop, others };
}

// ---- formatting ---------------------------------------------------------

export function usd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function usdExact(value: number): string {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function tokenPrice(value: number): string {
  if (value === 0) return "—";
  if (value < 0.01) return `$${value.toFixed(5)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(3)}`;
}

export function percent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

export function signedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
