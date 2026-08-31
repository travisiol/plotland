import { ButtonLink } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { siteConfig, world } from "@/lib/site-config";

/*
 * A masthead, not a hero: it names the sheet and states the one fact the
 * whole thing rests on, then gets out of the way of the map. The map is
 * the argument; a tall marketing hero would only delay it.
 */
export function Masthead() {
  return (
    <section className="border-b border-rule px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <Label className="mb-4 block">
            {world.totalParcels} equal parcels · Ethereum
          </Label>
          <h1 className="type-display max-w-[14ch] text-ink">
            Take your ground
          </h1>
        </div>

        <div className="max-w-[46ch]">
          <p className="type-body text-ink-soft">{siteConfig.description}</p>
          <ButtonLink href="#map" className="mt-5">
            Open the map
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
