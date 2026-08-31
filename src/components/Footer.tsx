import { Label } from "@/components/ui/Label";
import { claimConfig, siteConfig } from "@/lib/site-config";

const socials = [
  { href: siteConfig.x, label: "X" },
  { href: siteConfig.discord, label: "Discord" },
].filter((link): link is { href: string; label: string } => link.href !== null);

export function Footer() {
  return (
    <footer className="px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <Label className="block text-ink">{siteConfig.name}</Label>
          <p className="type-data mt-2 max-w-[46ch] text-ink-muted">
            Borders and coastlines from Natural Earth, public domain.
            Projection: Equal Earth.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex items-center gap-5">
            {socials.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="type-label text-ink-soft transition-colors duration-150 hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </div>
          <Label>
            {claimConfig.contractAddress ?? "Contract not deployed"}
          </Label>
        </div>
      </div>
    </footer>
  );
}
