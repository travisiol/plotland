import { Label } from "@/components/ui/Label";
import { claimConfig, world } from "@/lib/site-config";

const entries = [
  {
    q: "Why 999 parcels?",
    a: `The world's land divided into 999 equal-area hexagons. The count is fixed at the contract level — there is no second release and no way to add ground.`,
  },
  {
    q: "Are all parcels the same size?",
    a: "Yes, and that is the point. The grid is laid in an equal-area projection, so a parcel in Norway covers exactly as much ground as one in Kenya. Only the terrain under it differs.",
  },
  {
    q: "Why does Russia have a hundred of them?",
    a: "Because it is that big. Parcel counts follow land area and nothing else — no population, no economy, no weighting. Antarctica holds 97 for the same reason.",
  },
  {
    q: "What does a parcel cost?",
    a:
      claimConfig.priceEth !== null
        ? `${claimConfig.priceEth} ETH plus gas, up to ${world.maxPerWallet} per wallet.`
        : `Not announced. The price appears in the claim panel the moment it is set — up to ${world.maxPerWallet} per wallet.`,
  },
  {
    q: "When does claiming open?",
    a: "No date is set. The claim button on this page is already wired to the contract and unlocks by itself once one is deployed and switched on.",
  },
  {
    q: "Can I choose which parcel I get?",
    a: "Yes. You claim by parcel id, so you take the ground you picked on the map rather than whatever the next mint hands you.",
  },
  {
    q: "Which chain?",
    a: "Ethereum mainnet. Connect any injected wallet and the site will prompt you to switch if you are elsewhere.",
  },
  {
    q: "Where does the map come from?",
    a: "Natural Earth's public-domain 110m coastlines, projected with Equal Earth and cut into hexagons by a script in this repo. Nothing is fetched at runtime.",
  },
] as const;

export function Faq() {
  return (
    <section id="faq" className="border-b border-rule px-4 py-16 sm:px-6">
      <Label className="mb-3 block">Questions</Label>
      <h2 className="type-title mb-10 text-ink">Before you claim</h2>

      <dl className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
        {entries.map((entry) => (
          <div key={entry.q} className="border-t border-rule pt-4">
            <dt className="type-data font-semibold text-ink">{entry.q}</dt>
            <dd className="type-body mt-2 max-w-[52ch] text-ink-soft">
              {entry.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
