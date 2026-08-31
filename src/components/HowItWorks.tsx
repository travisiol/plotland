import { Label } from "@/components/ui/Label";

/*
 * Mechanics only. No rates, no multipliers, no projected returns — none of
 * that is decided, and a number invented here is the one thing on the page
 * a holder could actually be hurt by.
 */
const stages = [
  {
    step: "One",
    title: "Claim the ground",
    body: "Pick a hexagon and it is yours. Parcels are equal-area, so what you get is a fixed share of the planet's land, not a bigger or smaller one depending on where you pointed.",
  },
  {
    step: "Two",
    title: "Work it",
    body: "A parcel is a place things happen, not a picture. What the ground yields depends on what you do with it and on what is under it — terrain is set at generation and never changes.",
  },
  {
    step: "Three",
    title: "Hold or hand it on",
    body: "Whatever a parcel has accrued belongs to whoever holds it. Transfer the parcel and the position transfers with it, intact.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how" className="border-b border-rule px-4 py-16 sm:px-6">
      <Label className="mb-3 block">How it works</Label>
      <h2 className="type-title mb-10 text-chalk">Ground, then work, then hold</h2>

      <ol className="grid grid-cols-1 gap-px bg-rule md:grid-cols-3">
        {stages.map((stage) => (
          <li key={stage.step} className="bg-field px-0 py-6 md:px-6 md:first:pl-0">
            <Label className="text-claim-deep">{stage.step}</Label>
            <h3 className="type-data mt-4 text-base font-semibold text-chalk">
              {stage.title}
            </h3>
            <p className="type-body mt-2 max-w-[38ch] text-chalk-soft">
              {stage.body}
            </p>
          </li>
        ))}
      </ol>

      <p className="type-data mt-8 max-w-[62ch] text-chalk-muted">
        Yield rates and the list of activities are not finalised, so none are
        published here. Nothing on this page is a promise of return.
      </p>
    </section>
  );
}
