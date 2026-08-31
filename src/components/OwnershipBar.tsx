import { Label } from "@/components/ui/Label";
import { percent, type PlotMarket } from "@/lib/market";

/*
 * The single most important thing on the page to get across: a plot is not
 * bought whole. It is split between however many wallets hold its token,
 * and this bar is what says so at a glance.
 *
 * "You" is its own row and reads 0 until the visitor actually holds
 * something — showing a stranger a share they do not own would undo the
 * one idea the bar exists to teach.
 */
export function OwnershipBar({
  market,
  yourShare,
}: {
  market: PlotMarket;
  /** null when no wallet is connected. */
  yourShare: number | null;
}) {
  if (!market.isLive) return null;

  const [first = 0, second = 0, third = 0] = market.topHolders;
  const others = Math.max(0, 100 - first - second - third);

  const segments = [
    { key: "Owner #1", value: first, tone: "bg-gold" },
    { key: "Owner #2", value: second, tone: "bg-gold/70" },
    { key: "Owner #3", value: third, tone: "bg-gold/45" },
    { key: `Others (${Math.max(0, market.owners - 3)})`, value: others, tone: "bg-chalk/15" },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label className="text-chalk">Plot ownership</Label>
        <Label>{market.owners} owners</Label>
      </div>

      <div
        className="mt-3 flex h-3 w-full overflow-hidden border border-rule"
        role="img"
        aria-label={`Ownership split across ${market.owners} owners: largest holder ${percent(first)}`}
      >
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={segment.tone}
            style={{ width: `${segment.value}%` }}
          />
        ))}
      </div>

      <dl className="mt-3">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className="flex items-center justify-between border-t border-rule/60 py-1.5"
          >
            <dt className="flex items-center gap-2">
              <span className={`h-2 w-2 ${segment.tone}`} />
              <Label>{segment.key}</Label>
            </dt>
            <dd className="type-data text-chalk-soft">
              {percent(segment.value, 1)}
            </dd>
          </div>
        ))}

        {/* Kept apart from the sample split above: this row is about you. */}
        <div className="flex items-center justify-between border-t border-rule py-1.5">
          <dt>
            <Label className="text-gold">You</Label>
          </dt>
          <dd className="type-data text-chalk">
            {yourShare === null ? "Connect wallet" : percent(yourShare, 2)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
