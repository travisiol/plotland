import { Label } from "@/components/ui/Label";
import { ownershipSplit, percent, type PlotMarket } from "@/lib/market";

/*
 * The single most important thing on the page to get across: a plot is not
 * bought whole. It is split between however many wallets hold its token,
 * and this bar is what says so at a glance.
 *
 * Gold is always your slice, the blues are everyone else, so the shape
 * reads as "mine against the rest" before a single number is parsed. Your
 * slice stays at zero until you actually hold something — showing a
 * stranger a share they do not own would undo the one idea the bar exists
 * to teach.
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

  const split = ownershipSplit(market, yourShare ?? 0);

  const segments = [
    { key: "You", value: split.you, tone: "bg-gold" },
    { key: "Top 10 owners", value: split.topTen, tone: "bg-holder-near" },
    { key: "Other owners", value: split.others, tone: "bg-holder-far" },
  ];

  return (
    <div>
      <Label className="block text-chalk-muted">Ownership breakdown</Label>

      <div
        className="mt-3 flex h-2.5 w-full overflow-hidden"
        role="img"
        aria-label={`Ownership split across ${market.owners} owners`}
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
            className="flex items-center justify-between py-1"
          >
            <dt className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${segment.tone}`} />
              <span className="type-data text-chalk-soft">{segment.key}</span>
            </dt>
            <dd className="type-data text-chalk">
              {segment.key === "You" && yourShare === null
                ? "—"
                : percent(segment.value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
