import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--ink)] ring-offset-[var(--bg)] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--muted-2)] focus-visible:border-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
