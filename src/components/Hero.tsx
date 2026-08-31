import { ButtonLink } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { worldTotals } from "@/lib/market";

/*
 * The hero has one job: make it obvious, before any scrolling, that a plot
 * is a market you buy a slice of — not a thing one wallet takes whole.
 * The line under the wordmark carries the mechanic, and the strip below it
 * names the three verbs the rest of the page uses.
 */
export function Hero() {
  return (
    <section className="sheet-grid relative overflow-hidden border-b border-rule">
      <span
        aria-hidden
        className="dot-matrix pointer-events-none absolute left-6 top-8 hidden h-16 w-24 opacity-40 sm:block"
      />
      <span
        aria-hidden
        className="dot-matrix pointer-events-none absolute bottom-8 right-6 hidden h-16 w-24 opacity-40 sm:block"
      />

      <div className="relative px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[1100px] text-center">
          <Label className="text-gold">
            {worldTotals.totalPlots} plots · {worldTotals.totalPlots} markets ·
            one map
          </Label>

          <h1 className="type-hero wordmark-outline mt-6 text-chalk">
            Plotland
          </h1>

          <p className="type-display mt-4 text-chalk">Own the map.</p>

          <p className="type-body mx-auto mt-6 max-w-[62ch] text-chalk-soft">
            Buy shares of virtual land. Every plot has its own token, its own
            market and its own economy — so a single plot can be held by
            hundreds of people at once, you included.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="#map">Explore the map</ButtonLink>
            <a
              href="#how"
              className="type-label px-4 py-3 text-chalk-soft transition-colors duration-150 hover:text-gold"
            >
              How it works
            </a>
          </div>

          <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {["Claim your land", "Trade plots", "Earn from activity"].map(
              (beat, index) => (
                <li key={beat} className="flex items-center gap-3">
                  {index > 0 && (
                    <span aria-hidden className="h-px w-6 bg-gold/50" />
                  )}
                  <span className="type-label text-chalk-soft">{beat}</span>
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
