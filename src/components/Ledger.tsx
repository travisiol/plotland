"use client";

import { useMemo } from "react";
import { parcels } from "@/components/WorldMap";
import { Label, PreviewTag } from "@/components/ui/Label";
import { useClaims } from "@/lib/useClaims";

/*
 * The register of who holds what ground, by territory.
 *
 * The parcel counts are a property of the grid, not a claim about the
 * world: they say how much of the planet's land each country holds once it
 * is cut into 999 equal pieces. Russia having a hundred of them is a fact
 * about area, and it is the most interesting thing on this page.
 */
const ROWS = 16;

export function Ledger() {
  const { claimed, isPlaceholder } = useClaims();

  const rows = useMemo(() => {
    const totals = new Map<string, { total: number; taken: number }>();
    for (const parcel of parcels) {
      const row = totals.get(parcel.country) ?? { total: 0, taken: 0 };
      row.total += 1;
      if (claimed.has(parcel.id)) row.taken += 1;
      totals.set(parcel.country, row);
    }
    return [...totals.entries()]
      .map(([country, row]) => ({ country, ...row }))
      .sort((a, b) => b.total - a.total || a.country.localeCompare(b.country));
  }, [claimed]);

  const largest = rows[0]?.total ?? 1;
  const shown = rows.slice(0, ROWS);
  const rest = rows.length - shown.length;
  const restParcels = rows.slice(ROWS).reduce((sum, row) => sum + row.total, 0);

  return (
    <section id="ledger" className="border-b border-rule px-4 py-16 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label className="mb-3 block">The register</Label>
          <h2 className="type-title text-chalk">Ground by territory</h2>
        </div>
        <div className="flex items-center gap-3">
          {isPlaceholder && <PreviewTag />}
          <p className="type-data max-w-[380px] text-chalk-muted">
            How the planet&rsquo;s land divides once it is cut into 999 equal
            pieces. Area decides the count — nothing else does.
          </p>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-rule-strong text-left">
            <th className="py-2 pr-4">
              <Label>Territory</Label>
            </th>
            <th className="py-2 pr-4 text-right">
              <Label>Parcels</Label>
            </th>
            <th className="py-2 pr-4 text-right">
              <Label>Claimed</Label>
            </th>
            <th className="w-[38%] py-2">
              <Label>Against the largest</Label>
            </th>
          </tr>
        </thead>
        <tbody>
          {shown.map((row) => (
            <tr key={row.country} className="border-b border-rule">
              <td className="type-data py-2.5 pr-4 text-chalk">{row.country}</td>
              <td className="type-data py-2.5 pr-4 text-right text-chalk">
                {row.total}
              </td>
              <td className="type-data py-2.5 pr-4 text-right text-chalk-soft">
                {row.taken > 0 ? row.taken : "—"}
              </td>
              <td className="py-2.5">
                {/*
                  Scaled against the largest holder, not against the whole
                  world: at 999 parcels even Russia is 11%, so a share-of-
                  world bar would be a row of slivers. The column says what
                  the bar actually measures.
                */}
                <span className="flex h-2 w-full bg-rule/40" aria-hidden>
                  <span
                    className="h-full bg-claim/70"
                    style={{ width: `${(row.total / largest) * 100}%` }}
                  />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rest > 0 && (
        <p className="type-data mt-4 text-chalk-muted">
          And {rest} more territories holding {restParcels} parcels between
          them.
        </p>
      )}
    </section>
  );
}
