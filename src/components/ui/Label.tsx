import { clsx } from "clsx";
import type { ReactNode } from "react";

/** A key on the sheet: mono, tracked out, uppercase. */
export function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={clsx("type-label text-ink-muted", className)}>
      {children}
    </span>
  );
}

/**
 * Marks a figure that is a placeholder rather than a reading off the
 * chain, so nothing on the sheet can be mistaken for live data before the
 * contract exists.
 */
export function PreviewTag({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "type-label inline-flex items-center gap-1.5 border border-claim-deep/40 bg-claim/10 px-2 py-1 text-claim-deep",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 bg-claim-deep" />
      Preview
    </span>
  );
}
