import { Label, PreviewTag } from "@/components/ui/Label";
import { parcelById } from "@/lib/parcels";
import {
  liveMarkets,
  peakActivity,
  signedPercent,
  tokenPrice,
  usdExact,
} from "@/lib/market";

/*
 * A leaderboard, not a directory.
 *
 * Ranking plots by what has actually traded on them is the clearest way to
 * show that these are separate markets rather than one collection with one
 * price: two identical hexagons sit at wildly different valuations because
 * different numbers of people wanted in.
 */
const ROWS = 12;

const rows = [...liveMarkets]
  .sort((a, b) => b.volume24hUsd - a.volume24hUsd)
  .slice(0, ROWS);

export function Ledger() {
  return (
    <section id="ledger" className="scroll-mt-14 border-b border-rule px-4 py-16 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label className="mb-3 block text-gold">The register</Label>
          <h2 className="type-display text-chalk">Busiest plots</h2>
        </div>
        <div className="flex items-center gap-3">
          <PreviewTag />
          <p className="type-data max-w-[400px] text-chalk-muted">
            Example values, shown so the board reads the way it will once it
            is live. Real prices, volumes and owner counts land here as soon
            as trading opens after launch.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="border-b border-rule-strong text-left">
              <th className="py-2 pr-4">
                <Label>Plot</Label>
              </th>
              <th className="py-2 pr-4">
                <Label>Territory</Label>
              </th>
              <th className="py-2 pr-4 text-right">
                <Label>Price</Label>
              </th>
              <th className="py-2 pr-4 text-right">
                <Label>24h</Label>
              </th>
              <th className="py-2 pr-4 text-right">
                <Label>Owners</Label>
              </th>
              <th className="py-2 pr-4 text-right">
                <Label>24h volume</Label>
              </th>
              <th className="w-[22%] py-2">
                <Label>Activity</Label>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((market) => {
              const parcel = parcelById(market.id);
              return (
                <tr key={market.id} className="border-b border-rule">
                  <td className="type-data py-2.5 pr-4 text-gold">
                    #{String(market.id).padStart(3, "0")}
                  </td>
                  <td className="type-data py-2.5 pr-4 text-chalk">
                    {parcel?.country ?? "—"}
                  </td>
                  <td className="type-data py-2.5 pr-4 text-right text-chalk">
                    {tokenPrice(market.priceUsd)}
                  </td>
                  <td
                    className={`type-data py-2.5 pr-4 text-right ${
                      market.change24h >= 0 ? "text-gain" : "text-loss"
                    }`}
                  >
                    {signedPercent(market.change24h)}
                  </td>
                  <td className="type-data py-2.5 pr-4 text-right text-chalk-soft">
                    {market.owners}
                  </td>
                  <td className="type-data py-2.5 pr-4 text-right text-chalk">
                    {usdExact(market.volume24hUsd)}
                  </td>
                  <td className="py-2.5">
                    {/* Scaled against the busiest plot, which is what the
                        column says it measures. */}
                    <span className="flex h-2 w-full bg-rule/40" aria-hidden>
                      <span
                        className="h-full bg-gold"
                        style={{
                          width: `${(market.activity / peakActivity) * 100}%`,
                        }}
                      />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 border-l-2 border-gold pl-4">
        <p className="type-data text-chalk-soft">
          These rows are an example of how the board will look. The real
          figures appear right after launch.
        </p>
        <p className="type-data mt-2 max-w-[70ch] text-chalk-muted">
          Every one of these is a separate token with its own holders. Owning
          part of one gives you nothing in any of the others.
        </p>
      </div>
    </section>
  );
}
