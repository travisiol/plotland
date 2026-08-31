"use client";

import { useMemo, useState } from "react";
import { ClaimPanel } from "@/components/ClaimPanel";
import { WorldMap, parcels, type Parcel } from "@/components/WorldMap";
import { Label, PreviewTag } from "@/components/ui/Label";
import { useClaims } from "@/lib/useClaims";

/*
 * The whole working surface: map in the middle, the world's figures on one
 * side, the claim on the other. Selection lives here because both panels
 * and the map all need it.
 */
export function Atlas() {
  const { claimed, claimedCount, total, isPlaceholder } = useClaims();
  const [selected, setSelected] = useState<Parcel | null>(null);

  const settled = total > 0 ? (claimedCount / total) * 100 : 0;

  const territories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const parcel of parcels) {
      counts.set(parcel.country, (counts.get(parcel.country) ?? 0) + 1);
    }
    return counts;
  }, []);

  const claimedTerritories = useMemo(() => {
    const names = new Set<string>();
    for (const parcel of parcels) {
      if (claimed.has(parcel.id)) names.add(parcel.country);
    }
    return names.size;
  }, [claimed]);

  const figures = [
    { key: "Parcels claimed", value: `${claimedCount} / ${total}` },
    { key: "Ground settled", value: `${settled.toFixed(settled < 1 ? 1 : 0)}%` },
    { key: "Territories entered", value: `${claimedTerritories} / ${territories.size}` },
    { key: "Open ground", value: `${total - claimedCount}` },
  ];

  return (
    <section id="map" className="border-b border-rule">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        {/* The world, in figures */}
        <aside className="order-2 border-t border-rule px-4 py-5 lg:order-1 lg:border-r lg:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-chalk">The world</Label>
            {isPlaceholder && <PreviewTag />}
          </div>

          <dl className="mt-4">
            {figures.map((figure) => (
              <div
                key={figure.key}
                className="flex items-baseline justify-between border-t border-rule py-3"
              >
                <dt>
                  <Label>{figure.key}</Label>
                </dt>
                <dd className="type-data text-chalk">{figure.value}</dd>
              </div>
            ))}
          </dl>

          {isPlaceholder && (
            <p className="type-data mt-4 text-chalk-muted">
              Seeded starting state. Every figure here reads from the
              contract&rsquo;s own claim bitmap once claiming opens.
            </p>
          )}

          <div className="mt-6 border-t border-rule pt-4">
            <Label className="block">Key</Label>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-3 w-3 bg-claim" />
              <span className="type-data text-chalk-soft">Claimed</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-3 w-3 border border-rule-strong" />
              <span className="type-data text-chalk-soft">Open ground</span>
            </div>
          </div>
        </aside>

        {/* The map */}
        <div className="order-1 lg:order-2">
          <WorldMap
            claimed={claimed}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            // Equal Earth is roughly 2:1, so a full-height column would leave the
            // drawing marooned in empty field. This height gives it a proper
            // sheet margin instead — enough for the title block and the readout,
            // not so much that the map stops being the thing you look at.
            className="h-[52vh] min-h-[340px] w-full lg:h-[62vh] lg:min-h-[460px]"
          />
        </div>

        {/* The claim */}
        <aside className="order-3 border-t border-rule p-4 lg:border-l lg:border-t-0">
          <ClaimPanel
            parcel={selected}
            isClaimed={selected !== null && claimed.has(selected.id)}
          />
        </aside>
      </div>
    </section>
  );
}
