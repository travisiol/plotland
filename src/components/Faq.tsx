import { Label } from "@/components/ui/Label";
import { claimConfig, world } from "@/lib/site-config";

/*
 * Written against the one misreading that matters: that buying a plot
 * means buying the whole thing. The first three answers all attack it from
 * different directions, because it is the misunderstanding that would cost
 * somebody money.
 */
const entries = [
  {
    q: "Am I buying the whole plot?",
    a: "No. Every plot is a token, and you buy however much of that token you want. Hold 10% of a plot's supply and you hold roughly 10% of its economic ownership — hundreds of wallets can hold the same plot at once.",
  },
  {
    q: "So what does ownership actually mean?",
    a: "Your share of a plot is the percentage of its tokens you hold, and that same percentage decides your cut of the fees the plot's trading generates. Buy more of it and both go up; sell some and both go down.",
  },
  {
    q: "Where do the fees come from?",
    a: "From trading on that specific plot. Every buy and sell of a plot's token generates fees, and those fees are distributed across that plot's holders in proportion to what each one holds. A plot nobody trades generates nothing.",
  },
  {
    q: "Are all plots one big market?",
    a: `No — there are ${world.totalParcels} of them and each is independent. Its own token, its own price, its own holders, its own fees. Owning part of one gives you nothing in any of the others.`,
  },
  {
    q: "Why are some plots brighter on the globe?",
    a: "Brightness is activity. A gold hexagon has a market open, and the brighter it burns the more is being traded on it. Right now every plot is an empty outline, because no market has been opened anywhere.",
  },
  {
    q: "Are all plots the same size?",
    a: "Yes. The grid is cut in an equal-area projection, so a plot in Norway covers exactly as much ground as one in Kenya, and each one subtends the same angle on the globe. What differs is what people are willing to pay for it.",
  },
  {
    q: "Why does Russia have a hundred plots?",
    a: "Because it is that big. Plot counts follow land area and nothing else — no population, no economy, no weighting. Antarctica holds 97 for the same reason.",
  },
  {
    q: "What does it cost to buy in?",
    a:
      claimConfig.priceEth !== null
        ? `Whatever the plot's token is trading at, plus gas. There is no fixed entry — you decide how much of a plot to buy.`
        : `There is no fixed entry price. You buy as much or as little of a plot's token as you want, at whatever it is trading at, plus gas.`,
  },
  {
    q: "When does trading open?",
    a: "A few minutes after launch. Everything on this page is already wired to the contracts and turns on by itself — connect your wallet now and you are ready.",
  },
  {
    q: "Where does the globe come from?",
    a: "Natural Earth's public-domain coastlines. A script in this repo cuts the land into 999 hexagons using an equal-area projection, then converts every one back to real coordinates so they sit on the sphere at their true positions. Nothing is fetched at runtime.",
  },
] as const;

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-14 border-b border-rule px-4 py-16 sm:px-6">
      <Label className="mb-3 block text-gold">Questions</Label>
      <h2 className="type-display mb-12 text-chalk">Before you buy</h2>

      <dl className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
        {entries.map((entry) => (
          <div key={entry.q} className="border-t border-rule pt-4">
            <dt className="type-title text-chalk">{entry.q}</dt>
            <dd className="type-body mt-3 max-w-[54ch] text-chalk-soft">
              {entry.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
