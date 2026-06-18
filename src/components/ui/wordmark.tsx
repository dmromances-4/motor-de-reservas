import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  /** "light" for dark backgrounds, "dark" for light backgrounds */
  tone?: "light" | "dark";
  showDot?: boolean;
};

export function Wordmark({
  className,
  tone = "dark",
  showDot = true,
}: WordmarkProps) {
  return (
    <span
      className={cn(
        "font-display inline-flex items-baseline gap-0.5 text-lg font-semibold tracking-tight",
        className,
      )}
      style={{ color: tone === "light" ? "#ffffff" : "var(--ink)" }}
    >
      reserva
      <span style={{ color: "var(--teal)" }}>line</span>
      {showDot && (
        <span
          className="ml-1 inline-block h-1.5 w-1.5 translate-y-[-0.1em] rounded-full"
          style={{ backgroundColor: "var(--teal)" }}
        />
      )}
    </span>
  );
}
