import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(iso: string | Date, timezone = "Europe/Madrid") {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

export function formatDate(iso: string | Date, timezone = "Europe/Madrid") {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });
}
