import { Label } from "@/components/ui/Label";

/*
 * The whole mechanic as five beats, sat directly under the hero so the
 * chain is read before the map is even reached. Deliberately terse — the
 * diagrams further down do the explaining, this only has to establish the
 * shape: you buy a slice, the slice is a share, activity pays the share.
 */
const beats = [
  "Buy land shares",
  "Own a % of a plot",
  "People trade that plot",
  "The plot generates fees",
  "Owners earn their share",
] as const;

export function EconomyFlow() {
  return (
    <section className="border-b border-rule px-4 py-8 sm:px-6">
      <Label className="mb-5 block text-chalk-muted">
        Own a piece of land. Earn a piece of its activity.
      </Label>

      <ol className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {beats.map((beat, index) => (
          <li key={beat} className="flex flex-1 items-center gap-3">
            <div className="flex flex-1 items-center gap-3 border border-rule bg-field px-4 py-3">
              <span className="type-label text-gold">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="type-data text-chalk">{beat}</span>
            </div>
            {index < beats.length - 1 && (
              <span
                aria-hidden
                className="type-data shrink-0 text-gold/70 lg:rotate-0"
              >
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
