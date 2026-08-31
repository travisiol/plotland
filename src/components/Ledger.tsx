import { Label } from "@/components/ui/Label";
import { parcels } from "@/lib/parcels";
import { worldTotals } from "@/lib/market";

/*
 * The one board that can be filled honestly at genesis.
 *
 * Market rankings need markets, and there are none yet — but how the
 * planet's land divides into 999 equal plots is a fact about area that is
 * true today. Russia holding 108 of them is the most interesting thing this
 * page can say before a single trade happens.
 */
const ROWS = 16;

const rows = (() => {
  const totals = new Map<string, number>();
  for (const parcel of parcels) {
    totals.set(parcel.country, (totals.get(parcel.country) ?? 0) + 1);
  }
  return [...totals.entries()]
    .map(([country, total]) => ({ country, total }))
    .sort((a, b) => b.total - a.total || a.country.localeCompare(b.country));
})();

const largest = rows[0]?.total ?? 1;
const shown = rows.slice(0, ROWS);
const restCountries = rows.length - shown.length;
const restPlots = rows.slice(ROWS).reduce((sum, row) => sum + row.total, 0);

export function Ledger() {
  return (
    <section
      id="ledger"
      className="scroll-mt-16 border-b border-rule px-4 py-16 sm:px-6"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label className="mb-3 block text-gold">The register</Label>
          <h2 className="type-display text-chalk">Plots by territory</h2>
        </div>
        <p className="type-data max-w-[400px] text-chalk-muted">
          How the planet&rsquo;s land divides once it is cut into{" "}
          {worldTotals.totalPlots} equal plots. Area decides the count —
          nothing else does.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-rule-strong text-left">
              <th className="py-2 pr-4">
                <Label>Territory</Label>
              </th>
              <th className="py-2 pr-4 text-right">
                <Label>Plots</Label>
              </th>
              <th className="py-2 pr-4 text-right">
                <Label>Markets open</Label>
              </th>
              <th className="w-[34%] py-2">
                <Label>Against the largest</Label>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.country} className="border-b border-rule">
                <td className="type-data py-2.5 pr-4 text-chalk">
                  {row.country}
                </td>
                <td className="type-data py-2.5 pr-4 text-right text-chalk">
                  {row.total}
                </td>
                <td className="type-data py-2.5 pr-4 text-right text-chalk-muted">
                  0
                </td>
                <td className="py-2.5">
                  {/* Scaled against the largest holder of ground, which is
                      what the column says it measures. At 999 plots even
                      Russia is 11%, so a share-of-world bar would be a row
                      of slivers. */}
                  <span className="flex h-2 w-full bg-rule/40" aria-hidden>
                    <span
                      className="h-full bg-chalk/60"
                      style={{ width: `${(row.total / largest) * 100}%` }}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 border-l-2 border-gold pl-4">
        <p className="type-data text-chalk-soft">
          And {restCountries} more territories holding {restPlots} plots
          between them. No market has been opened anywhere yet — the
          rankings by price and volume appear here as soon as plots start
          trading.
        </p>
        <p className="type-data mt-2 max-w-[70ch] text-chalk-muted">
          Every plot is a separate token with its own holders. Owning part of
          one gives you nothing in any of the others.
        </p>
      </div>
    </section>
  );
}
