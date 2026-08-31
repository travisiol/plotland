import { parcels } from "@/lib/parcels";
import type { PlotMarket } from "@/lib/market";

/*
 * A worked example of a living world.
 *
 * Nothing here is real and nothing here is ever shown unless a visitor asks
 * for it: it sits behind an explicit "preview a live world" control so the
 * site can demonstrate what an active plot looks like without ever claiming
 * anybody has invested. The default state of the site remains the truth —
 * 999 plots open, none taken.
 *
 * Figures are derived from the plot id so the same plot always shows the
 * same example, and so server and client render identically.
 */

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

export interface PreviewHolder {
  handle: string;
  address: string;
  share: number;
  joinedDaysAgo: number;
}

export interface PreviewMarket extends PlotMarket {
  holders: PreviewHolder[];
}

const NAMES = [
  "cobaltsentry",
  "hollowbaron",
  "ashwolf",
  "vaultkeeper",
  "emberlark",
  "quietharbor",
  "northfell",
  "slatecrown",
  "duskmeridian",
  "ironvale",
] as const;

function makeHolders(rand: () => number, owners: number): PreviewHolder[] {
  const count = Math.min(5, owners);
  const holders: PreviewHolder[] = [];
  let remaining = 62;
  for (let i = 0; i < count; i += 1) {
    const share = i === count - 1 ? remaining : remaining * (0.34 + rand() * 0.2);
    remaining -= share;
    const hex = Math.floor(rand() * 0xffffff)
      .toString(16)
      .padStart(6, "0");
    const tail = Math.floor(rand() * 0xffff)
      .toString(16)
      .padStart(4, "0");
    holders.push({
      handle: `${NAMES[Math.floor(rand() * NAMES.length)]}-${Math.floor(rand() * 90) + 10}`,
      address: `0x${hex}…${tail}`,
      share: Math.round(share * 100) / 100,
      joinedDaysAgo: Math.floor(rand() * 12) + 1,
    });
  }
  return holders.sort((a, b) => b.share - a.share);
}

function build(id: number): PreviewMarket {
  const rand = hash(id);
  const roll = rand();
  const isLive = roll < 0.26;

  if (!isLive) {
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
      holders: [],
    };
  }

  // Power law: most open plots are quiet, a handful carry real traffic.
  const heat = Math.pow(rand(), 2.6);
  const owners = Math.max(3, Math.round(4 + heat * 900 + rand() * 40));
  const priceUsd = 0.004 + heat * 2.4 + rand() * 0.02;
  const volume24hUsd = Math.round(120 + heat * 240_000 + rand() * 900);
  const marketCapUsd = Math.round(priceUsd * (200_000 + heat * 3_000_000));
  const rewardsUsd = Math.round(volume24hUsd * 0.018 * (1 + rand() * 3));
  const change24h = (rand() - 0.42) * (12 + heat * 60);
  const holders = makeHolders(rand, owners);

  return {
    id,
    isLive: true,
    activity: heat,
    priceUsd,
    change24h,
    marketCapUsd,
    volume24hUsd,
    owners,
    rewardsUsd,
    topHolders: holders.slice(0, 3).map((holder) => holder.share),
    holders,
  };
}

const byId = new Map<number, PreviewMarket>();
for (const parcel of parcels) byId.set(parcel.id, build(parcel.id));

export function previewMarketFor(id: number): PreviewMarket {
  return byId.get(id) ?? build(id);
}

const live = [...byId.values()].filter((market) => market.isLive);

/** Owner count at which a plot is considered crowded and drawn in green. */
export const CROWDED_OWNERS = 120;

export const previewPeakActivity = live.reduce(
  (max, market) => Math.max(max, market.activity),
  0.0001,
);

export const previewTotals = {
  totalPlots: parcels.length,
  livePlots: live.length,
  owners: live.reduce((sum, market) => sum + market.owners, 0),
  volume24hUsd: live.reduce((sum, market) => sum + market.volume24hUsd, 0),
  rewardsUsd: live.reduce((sum, market) => sum + market.rewardsUsd, 0),
  claimedPct: Math.round((live.length / parcels.length) * 100),
};
