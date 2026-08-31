import { Label } from "@/components/ui/Label";

/*
 * Four steps, each with a small drawn diagram rather than a paragraph.
 * The pictures do the explaining: a plot singled out of the grid, that
 * same plot cut into holder shares, a market filling up, fees flowing back
 * out in the same proportions as the split. Read in order they answer the
 * question the whole site turns on — what exactly am I buying.
 */

function Hex({ fill = "none" }: { fill?: string }) {
  return (
    <path
      d="M22 3 L38 12.5 V31.5 L22 41 L6 31.5 V12.5 Z"
      fill={fill}
      stroke="currentColor"
      strokeWidth="1.5"
    />
  );
}

/** 01 — one plot singled out of the grid. */
function PickDiagram() {
  return (
    <svg
      viewBox="0 0 132 46"
      className="h-14 w-full text-chalk-muted"
      aria-hidden
    >
      <g opacity="0.4">
        <Hex />
      </g>
      <g transform="translate(44 0)" className="text-gold">
        <Hex fill="rgba(242,167,27,0.85)" />
      </g>
      <g transform="translate(88 0)" opacity="0.4">
        <Hex />
      </g>
    </svg>
  );
}

/** 02 — the same plot cut into holder shares. */
function ShareDiagram() {
  return (
    <svg viewBox="0 0 132 46" className="h-14 w-full text-gold" aria-hidden>
      <defs>
        <clipPath id="plot-hex-clip">
          <path d="M22 3 L38 12.5 V31.5 L22 41 L6 31.5 V12.5 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#plot-hex-clip)">
        <rect x="6" y="3" width="32" height="14" fill="rgba(242,167,27,0.9)" />
        <rect x="6" y="17" width="32" height="9" fill="rgba(242,167,27,0.6)" />
        <rect x="6" y="26" width="32" height="15" fill="rgba(242,167,27,0.28)" />
      </g>
      <Hex />
      <text x="54" y="20" fill="#b6c9dd" fontSize="8.5" letterSpacing="1.4">
        ONE PLOT
      </text>
      <text x="54" y="32" fill="#b6c9dd" fontSize="8.5" letterSpacing="1.4">
        MANY OWNERS
      </text>
    </svg>
  );
}

/** 03 — a market filling up as more people buy in. */
function MarketDiagram() {
  const bars = [9, 15, 12, 22, 19, 30, 26, 38];
  return (
    <svg viewBox="0 0 132 46" className="h-14 w-full text-gold" aria-hidden>
      {bars.map((height, index) => (
        <rect
          key={index}
          x={index * 16 + 3}
          y={44 - height}
          width="9"
          height={height}
          fill="currentColor"
          opacity={0.35 + index * 0.08}
        />
      ))}
    </svg>
  );
}

/** 04 — fees leaving the plot, split in the same proportions. */
function FeesDiagram() {
  const rows = [6, 20, 34];
  return (
    <svg viewBox="0 0 132 46" className="h-14 w-full text-gold" aria-hidden>
      <Hex fill="rgba(242,167,27,0.75)" />
      <path
        d="M42 22 H60"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      {rows.map((y, index) => (
        <g key={y} opacity={0.9 - index * 0.24}>
          <path
            d={"M60 22 C 72 22, 74 " + (y + 6) + ", 84 " + (y + 6)}
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <rect
            x="86"
            y={y + 2}
            width={28 - index * 7}
            height="8"
            fill="currentColor"
          />
        </g>
      ))}
    </svg>
  );
}

const steps = [
  {
    index: "01",
    title: "Choose a plot",
    body: "Explore the map and pick a land you believe in. Gold plots already trade; the brighter they burn, the busier they are.",
    Diagram: PickDiagram,
  },
  {
    index: "02",
    title: "Buy a share",
    body: "Each plot has its own token. Buy as much or as little of it as you want — you are buying a percentage, not the whole plot.",
    Diagram: ShareDiagram,
  },
  {
    index: "03",
    title: "The market grows",
    body: "Other people buy and sell shares of that same plot. Its price and its holder count move with them.",
    Diagram: MarketDiagram,
  },
  {
    index: "04",
    title: "Earn from activity",
    body: "Every trade on the plot generates fees. Those fees are split between holders in proportion to what each one holds.",
    Diagram: FeesDiagram,
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-14 border-b border-rule px-4 py-16 sm:px-6">
      <Label className="mb-3 block text-gold">How it works</Label>
      <h2 className="type-display mb-3 text-chalk">
        Every plot is its own economy
      </h2>
      <p className="type-body mb-12 max-w-[64ch] text-chalk-soft">
        One map, hundreds of independent markets. Here is the whole mechanic.
      </p>

      <ol className="grid grid-cols-1 gap-px bg-rule sm:grid-cols-2 xl:grid-cols-4">
        {steps.map(({ index, title, body, Diagram }) => (
          <li key={index} className="bg-void p-6">
            <div className="mb-6 border border-rule bg-field p-4">
              <Diagram />
            </div>
            <Label className="text-gold">{index}</Label>
            <h3 className="type-title mt-3 text-chalk">{title}</h3>
            <p className="type-body mt-3 text-chalk-soft">{body}</p>
          </li>
        ))}
      </ol>

      <p className="type-data mt-8 max-w-[70ch] text-chalk-muted">
        Fee rates and the split are not finalised, so none are published here.
        Nothing on this page is a promise of return — a plot can lose value as
        easily as it gains it.
      </p>
    </section>
  );
}
