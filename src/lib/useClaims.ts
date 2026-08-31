"use client";

import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { mainnet } from "wagmi/chains";
import { decodeClaimedBitmap, plotlandAbi } from "@/lib/plotlandAbi";
import { claimConfig, world } from "@/lib/site-config";

/**
 * Placeholder claims are spread evenly across the parcel numbering rather
 * than taken from the front. Parcels are numbered north to south, so the
 * first three would all sit in the Canadian arctic and the map would read
 * as broken instead of early.
 */
function placeholderClaims(count: number, total: number): Set<number> {
  const claimed = new Set<number>();
  for (let i = 0; i < Math.min(count, total); i += 1) {
    claimed.add(Math.floor(((i + 0.5) * total) / Math.max(1, count)) + 1);
  }
  return claimed;
}

export function useClaims() {
  const address = claimConfig.contractAddress;

  const { data, isLoading, isError } = useReadContract({
    address: address ?? undefined,
    abi: plotlandAbi,
    functionName: "claimedBitmap",
    chainId: mainnet.id,
    query: { enabled: address !== null, refetchInterval: 20_000 },
  });

  const claimed = useMemo(() => {
    if (address !== null && Array.isArray(data)) {
      return decodeClaimedBitmap(data as readonly bigint[], world.totalParcels);
    }
    return placeholderClaims(world.placeholderClaims, world.totalParcels);
  }, [address, data]);

  return {
    claimed,
    claimedCount: claimed.size,
    total: world.totalParcels,
    isPlaceholder: address === null || !Array.isArray(data),
    isLoading: address !== null && isLoading,
    isError: address !== null && isError,
  };
}
