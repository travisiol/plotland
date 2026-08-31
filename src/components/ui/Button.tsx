import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/*
 * One filled button, in claim-orange, because pressing it is the act the
 * whole page exists for. Everything else is an outline.
 */
const base =
  "type-label inline-flex items-center justify-center gap-2 rounded-sm px-4 py-3 transition-colors duration-150 disabled:cursor-not-allowed";

export function Button({
  children,
  variant = "solid",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "solid" | "outline";
}) {
  return (
    <button
      type="button"
      className={clsx(
        base,
        variant === "solid"
          ? "bg-claim text-ink hover:bg-claim-deep hover:text-paper disabled:bg-transparent disabled:text-ink-muted disabled:ring-1 disabled:ring-rule-strong disabled:ring-inset"
          : "text-ink ring-1 ring-rule-strong ring-inset hover:bg-ink hover:text-paper disabled:text-ink-muted",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={clsx(
        base,
        "bg-claim text-ink hover:bg-claim-deep hover:text-paper",
        className,
      )}
    >
      {children}
    </a>
  );
}
