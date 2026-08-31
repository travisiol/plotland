import { parcels, type Parcel } from "@/lib/parcels";

/*
 * Every plot is its own economy.
 *
 * A plot is not a thing one wallet buys outright — it is a token with its
 * own market, split between however many holders want a piece. Ownership
 * is simply the share of that plot's supply you hold, and the fees its
 * trading throws off are split the same way.
 *
 * Until the contracts exist there is no market to read, so the figures
 * below are generated deterministically from the plot id. They are sample
 * data and the UI labels them as such everywhere they appear — a market
 * surface showing invented volume as if it were real is the one thing on
 * this site that could actually cost somebody money.
 */

/** Deterministic hash so server and client render identical sample data. */
function hash(seed: number): () => number {
  let state = (seed * 2654435761) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PlotMarket {
  id: number;
  /** False when nobody has opened a market on this plot yet. */
  isLive: boolean;
  /** 0–1, drives how strongly the plot burns on the map. */
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

function buildMarket(parcel: Parcel): PlotMarket {
  const rand = hash(parcel.id);
  const roll = rand();

  // About a quarter of plots have a market open in the sample state. Much
  // denser than this and the map washes gold, which teaches the wrong
  // thing — the point is that some plots draw far more than others.
  const isLive = roll < 0.24;

  if (!isLive) {
    return {
      id: parcel.id,
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

  // Power law: most live plots are quiet, a handful carry real volume.
  const heat = Math.pow(rand(), 2.6);
  const priceUsd = 0.004 + heat * 2.4 + rand() * 0.02;
  const owners = Math.max(3, Math.round(6 + heat * 900 + rand() * 30));
  const volume24hUsd = Math.round(120 + heat * 240_000 + rand() * 900);
  const marketCapUsd = Math.round(priceUsd * (200_000 + heat * 3_000_000));
  const rewardsUsd = Math.round(volume24hUsd * 0.018 * (1 + rand() * 3));
  const change24h = (rand() - 0.42) * (12 + heat * 60);

  // Concentration eases as a plot picks up holders: an early plot is a few
  // big holders, a busy one is a long tail.
  const lead = 26 - heat * 14 + rand() * 6;
  const topHolders = [lead, lead * 0.62, lead * 0.41].map(
    (share) => Math.round(share * 100) / 100,
  );

  return {
    id: parcel.id,
    isLive: true,
    activity: heat,
    priceUsd,
    change24h,
    marketCapUsd,
    volume24hUsd,
    owners,
    rewardsUsd,
    topHolders,
  };
}

const marketById = new Map<number, PlotMarket>();
for (const parcel of parcels) {
  marketById.set(parcel.id, buildMarket(parcel));
}

export function marketFor(id: number): PlotMarket {
  return (
    marketById.get(id) ?? {
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
    }
  );
}

export const allMarkets = [...marketById.values()];
export const liveMarkets = allMarkets.filter((m) => m.isLive);

export const worldTotals = {
  livePlots: liveMarkets.length,
  totalPlots: parcels.length,
  owners: liveMarkets.reduce((sum, m) => sum + m.owners, 0),
  volume24hUsd: liveMarkets.reduce((sum, m) => sum + m.volume24hUsd, 0),
  rewardsUsd: liveMarkets.reduce((sum, m) => sum + m.rewardsUsd, 0),
};

/** Activity of the busiest plot, so the map can scale its heat against it. */
export const peakActivity = liveMarkets.reduce(
  (max, m) => Math.max(max, m.activity),
  0.0001,
);

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

/**
 * Rarity is not a made-up per-plot attribute — it is where the plot sits in
 * the activity distribution. A plot is Legendary because more is happening
 * on it than on 98% of the map, which is a fact about the market rather
 * than a sticker.
 */
export type Tier = "Legendary" | "Rare" | "Uncommon" | "Common" | "Unopened";

const ranked = [...liveMarkets].sort((a, b) => b.activity - a.activity);
const rankById = new Map(ranked.map((market, index) => [market.id, index]));

export function tierFor(id: number): Tier {
  const market = marketFor(id);
  if (!market.isLive) return "Unopened";
  const rank = rankById.get(id) ?? ranked.length;
  const pct = rank / Math.max(1, ranked.length);
  if (pct < 0.02) return "Legendary";
  if (pct < 0.12) return "Rare";
  if (pct < 0.4) return "Uncommon";
  return "Common";
}

/** Grid reference on the hex lattice — the plot's real position on the map. */
export function gridRef(x: number, y: number): string {
  const col = Math.round((x + 2.66) / 0.0567);
  const row = Math.round((1.31 - y) / 0.0655);
  return `X: ${col} Y: ${row}`;
}

/**
 * The breakdown the card draws: your slice, the next largest holders, and
 * the long tail. Splitting it this way rather than naming individual
 * wallets is what makes "one plot, many owners" legible at a glance.
 */
export function ownershipSplit(market: PlotMarket, yourShare: number) {
  const topTen = market.topHolders.reduce((sum, share) => sum + share, 0) * 1.35;
  const cappedTop = Math.min(Math.max(0, 100 - yourShare), topTen);
  const others = Math.max(0, 100 - yourShare - cappedTop);
  return { you: yourShare, topTen: cappedTop, others };
}
